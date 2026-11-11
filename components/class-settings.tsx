'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { SaveStatus, Section, Toggle } from '@/components/ui';
import {
  CLASS_NAME_MAX,
  ClassSettings,
  HOME_MESSAGE_MAX,
  saveClassSettings,
  useClassSettings,
} from '@/lib/class-settings';
import { getFirebaseDb } from '@/lib/firebase';
import { roleLabel, useCurrentUser } from '@/lib/use-current-user';
import type { UserRole } from '@/lib/user-profile';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Save handling shared by the class info and feature sections. */
function useSaver(uid: string | undefined) {
  const [status, setStatus] = useState<SaveState>('idle');
  const save = async (changes: Partial<ClassSettings>) => {
    if (!uid) return;
    setStatus('saving');
    try {
      await saveClassSettings(uid, changes);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };
  return { status, setStatus, save };
}

function ClassInfoSection({ uid, settings }: { uid: string; settings: ClassSettings }) {
  const [name, setName] = useState(settings.name);
  const [homeMessage, setHomeMessage] = useState(settings.homeMessage);
  const { status, setStatus, save } = useSaver(uid);
  const changed = name.trim() !== settings.name || homeMessage.trim() !== settings.homeMessage;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    void save({ name, homeMessage });
  };

  return (
    <Section id="class" title="Class" description="Shown in the menu and at the top of Home for everyone.">
      <form onSubmit={submit} className="space-y-4">
        <label className="label">
          Class name
          <input
            value={name}
            onChange={(event) => { setName(event.target.value); setStatus('idle'); }}
            maxLength={CLASS_NAME_MAX}
            required
            placeholder="e.g. Grade 9 · Class 2"
            className="input mt-1.5 sm:max-w-sm"
          />
        </label>
        <label className="label">
          Message on Home <span className="font-normal text-slate-500">(optional)</span>
          <textarea
            value={homeMessage}
            onChange={(event) => { setHomeMessage(event.target.value); setStatus('idle'); }}
            maxLength={HOME_MESSAGE_MAX}
            rows={2}
            placeholder="e.g. Field trip forms are due Friday."
            className="input mt-1.5"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            One short line everyone sees when they open the site. Leave empty to hide it. {homeMessage.length}/{HOME_MESSAGE_MAX}
          </span>
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={!changed || !name.trim() || status === 'saving'} className="btn btn-primary">
            {status === 'saving' ? 'Saving…' : 'Save'}
          </button>
          <SaveStatus status={status} />
        </div>
      </form>
    </Section>
  );
}

function FeaturesSection({ uid, settings }: { uid: string; settings: ClassSettings }) {
  const { status, save } = useSaver(uid);
  // Switches save as soon as they're flipped.
  const flip = (changes: Partial<ClassSettings>) => void save(changes);

  return (
    <Section
      id="features"
      title="Features"
      description="Changes apply right away."
      action={<SaveStatus status={status} />}
    >
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        <Toggle
          label="Suggestion box"
          hint="Students can send suggestions to the class president and teacher."
          checked={settings.suggestionsEnabled}
          disabled={status === 'saving'}
          onChange={(checked) => flip({ suggestionsEnabled: checked })}
        />
        <Toggle
          label="Allow anonymous suggestions"
          hint="Students can choose to leave their name off."
          checked={settings.anonymousSuggestions}
          disabled={status === 'saving' || !settings.suggestionsEnabled}
          onChange={(checked) => flip({ anonymousSuggestions: checked })}
        />
        <Toggle
          label="Students can post class events"
          hint="When off, students can only add private events to the calendar."
          checked={settings.studentsCanPostEvents}
          disabled={status === 'saving'}
          onChange={(checked) => flip({ studentsCanPostEvents: checked })}
        />
      </div>
    </Section>
  );
}

type Subject = { id: string; name: string; archived: boolean };

const starterSubjects = ['Mathematics', 'Science', 'English', 'History', 'Spanish'];

function SubjectsSection({ uid }: { uid: string }) {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const snapshot = await getDocs(collection(db, 'subjects'));
      setSubjects(snapshot.docs
        .map((item) => ({ id: item.id, name: String(item.data().name || ''), archived: Boolean(item.data().archived) }))
        .filter((item) => item.name)
        .sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name)));
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const exists = (name: string, exceptId?: string) =>
    (subjects || []).some((item) => item.id !== exceptId && item.name.toLowerCase() === name.toLowerCase());

  const run = async (action: () => Promise<void>, failure: string) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  const add = async (names: string[]) => {
    const db = getFirebaseDb();
    if (!db) return;
    const now = new Date().toISOString();
    await Promise.all(names.map((name) => addDoc(collection(db, 'subjects'), {
      name: name.slice(0, 40),
      color: '#4a64bd',
      archived: false,
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
    })));
  };

  const submitNew = (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (exists(name)) {
      setError(`“${name}” is already on the list.`);
      return;
    }
    void run(async () => { await add([name]); setNewName(''); }, 'Could not add that subject.');
  };

  const saveRename = (subject: Subject) => {
    const name = editName.trim();
    if (!name || name === subject.name) {
      setEditingId(null);
      return;
    }
    if (exists(name, subject.id)) {
      setError(`“${name}” is already on the list.`);
      return;
    }
    const db = getFirebaseDb();
    if (!db) return;
    void run(async () => {
      await updateDoc(doc(db, 'subjects', subject.id), { name: name.slice(0, 40), updatedAt: new Date().toISOString() });
      setEditingId(null);
    }, 'Could not rename that subject.');
  };

  const setHidden = (subject: Subject, archived: boolean) => {
    const db = getFirebaseDb();
    if (!db) return;
    void run(
      () => updateDoc(doc(db, 'subjects', subject.id), { archived, updatedAt: new Date().toISOString() }),
      'Could not update that subject.',
    );
  };

  return (
    <Section
      id="subjects"
      title="Subjects"
      description="The choices offered when adding homework. Hidden subjects stay on homework that already uses them."
    >
      {error ? <p role="alert" className="note note-error mb-3">{error}</p> : null}

      {loadFailed ? (
        <p role="alert" className="note note-error">Could not load subjects. Reload the page to try again.</p>
      ) : subjects === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : subjects.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-4">
          <p className="text-[15px] text-slate-700">No subjects yet. Until you add some, the homework form suggests {starterSubjects.join(', ')}.</p>
          <button type="button" disabled={busy} onClick={() => void run(() => add(starterSubjects), 'Could not add subjects.')} className="btn btn-sm mt-3">
            Start with these
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {subjects.map((subject) => (
            <li key={subject.id} className="flex min-h-[52px] flex-wrap items-center gap-2 py-2">
              {editingId === subject.id ? (
                <form
                  onSubmit={(event) => { event.preventDefault(); saveRename(subject); }}
                  className="flex flex-1 flex-wrap items-center gap-2"
                >
                  <input
                    autoFocus
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Escape') setEditingId(null); }}
                    maxLength={40}
                    aria-label={`New name for ${subject.name}`}
                    className="input max-w-xs py-1.5"
                  />
                  <button type="submit" disabled={busy} className="btn btn-primary btn-sm">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="btn btn-sm">Cancel</button>
                </form>
              ) : (
                <>
                  <span className={`min-w-0 flex-1 text-[15px] ${subject.archived ? 'text-slate-400' : 'text-slate-900'}`}>
                    {subject.name}
                    {subject.archived ? <span className="chip ml-2 bg-slate-100 text-slate-600">Hidden</span> : null}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { setEditingId(subject.id); setEditName(subject.name); setError(''); }}
                    className="btn btn-sm"
                  >
                    Rename
                  </button>
                  <button type="button" disabled={busy} onClick={() => setHidden(subject, !subject.archived)} className="btn btn-sm">
                    {subject.archived ? 'Show' : 'Hide'}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {loadFailed ? null : (
        <form onSubmit={submitNew} className="mt-4 flex flex-wrap gap-2">
        <input
          value={newName}
          onChange={(event) => { setNewName(event.target.value); setError(''); }}
          maxLength={40}
          placeholder="New subject"
          aria-label="New subject name"
          className="input max-w-xs"
        />
        <button type="submit" disabled={busy || !newName.trim()} className="btn">Add</button>
        </form>
      )}
    </Section>
  );
}

type Member = { uid: string; name: string; email: string; role: UserRole };

const roleOrder: Record<UserRole, number> = { TEACHER: 0, CLASS_PRESIDENT: 1, STUDENT: 2 };

function MembersSection({ uid }: { uid: string }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) return;
    getDocs(collection(db, 'users'))
      .then((snapshot) => {
        setMembers(snapshot.docs
          .map((item) => {
            const data = item.data();
            const role: UserRole = data.role === 'TEACHER' || data.role === 'CLASS_PRESIDENT' ? data.role : 'STUDENT';
            return { uid: item.id, name: data.displayName || data.email || 'Unnamed', email: data.email || '', role };
          })
          .sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name)));
      })
      .catch(() => setLoadFailed(true));
  }, []);

  const changeRole = async (member: Member, role: UserRole) => {
    const db = getFirebaseDb();
    if (!db || role === member.role) return;
    setSavingUid(member.uid);
    setError('');
    try {
      await updateDoc(doc(db, 'users', member.uid), { role, updatedAt: new Date().toISOString() });
      setMembers((current) => (current || []).map((item) => (item.uid === member.uid ? { ...item, role } : item)));
    } catch {
      setError(`Could not change ${member.name}’s role.`);
    } finally {
      setSavingUid(null);
    }
  };

  const presidents = (members || []).filter((member) => member.role === 'CLASS_PRESIDENT').length;

  return (
    <Section
      id="members"
      title="Members"
      description={
        members && members.length
          ? `${members.length} ${members.length === 1 ? 'person has' : 'people have'} signed in · ${presidents} class ${presidents === 1 ? 'president' : 'presidents'}`
          : 'Everyone who has signed in to the site.'
      }
    >
      {error ? <p role="alert" className="note note-error mb-3">{error}</p> : null}
      {loadFailed ? (
        <p role="alert" className="note note-error">Could not load the member list. Reload the page to try again.</p>
      ) : members === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-slate-600">No one has signed in yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {members.map((member) => (
            <li key={member.uid} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate text-[15px] text-slate-900">
                  {member.name}
                  {member.uid === uid ? <span className="ml-1.5 text-sm text-slate-500">(you)</span> : null}
                </p>
                {member.email ? <p className="truncate text-sm text-slate-500">{member.email}</p> : null}
              </div>
              {member.role === 'TEACHER' || member.uid === uid ? (
                <span className="text-sm text-slate-600">{roleLabel(member.role)}</span>
              ) : (
                <select
                  value={member.role}
                  disabled={savingUid === member.uid}
                  onChange={(event) => void changeRole(member, event.target.value as UserRole)}
                  aria-label={`Role for ${member.name}`}
                  className="input w-auto py-1.5 text-sm"
                >
                  <option value="STUDENT">Student</option>
                  <option value="CLASS_PRESIDENT">Class president</option>
                </select>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-slate-500">Teacher accounts are set up in the Firebase console, not here.</p>
    </Section>
  );
}

const sections = [
  { id: 'class', label: 'Class' },
  { id: 'features', label: 'Features' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'members', label: 'Members' },
];

export function ClassSettingsPage() {
  const { user, isStaff, isTeacher, loading } = useCurrentUser();
  const { settings, loading: settingsLoading } = useClassSettings();

  if (loading || (user && settingsLoading)) return <p className="text-slate-500">Loading…</p>;

  if (!user) {
    return (
      <p className="note note-info">
        <Link href="/auth" className="font-medium underline">Sign in</Link> with a class president or teacher account to change class settings.
      </p>
    );
  }

  if (!isStaff) {
    return <p className="note note-info">Only the class president and teacher can change class settings.</p>;
  }

  return (
    <div className="space-y-5">
      <nav aria-label="Settings sections" className="flex flex-wrap gap-1 text-sm">
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="rounded-md px-2.5 py-1.5 text-slate-700 hover:bg-slate-200/60">
            {section.label}
          </a>
        ))}
      </nav>

      <ClassInfoSection uid={user.uid} settings={settings} />
      <FeaturesSection uid={user.uid} settings={settings} />
      <SubjectsSection uid={user.uid} />
      {isTeacher ? (
        <MembersSection uid={user.uid} />
      ) : (
        <Section id="members" title="Members" description="Who is class president.">
          <p className="text-[15px] text-slate-700">Only a teacher can change who is class president.</p>
        </Section>
      )}
    </div>
  );
}
