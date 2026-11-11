'use client';

import { useSyncExternalStore } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { DEFAULT_CLASS_ID } from '@/lib/user-profile';

/**
 * Settings the class president and teacher can change. Stored on
 * `classes/default`; the switches live under `settings` so Firestore rules
 * can read them. Keep field names in sync with firestore.rules.
 */
export type ClassSettings = {
  name: string;
  homeMessage: string;
  suggestionsEnabled: boolean;
  anonymousSuggestions: boolean;
  studentsCanPostEvents: boolean;
};

export const DEFAULT_CLASS_SETTINGS: ClassSettings = {
  name: 'Room 2A',
  homeMessage: '',
  suggestionsEnabled: true,
  anonymousSuggestions: true,
  studentsCanPostEvents: true,
};

export const CLASS_NAME_MAX = 40;
export const HOME_MESSAGE_MAX = 200;

type ClassState = { settings: ClassSettings; loading: boolean };

const initialState: ClassState = { settings: DEFAULT_CLASS_SETTINGS, loading: true };
let state = initialState;
let started = false;
let authSequence = 0;
const listeners = new Set<() => void>();

function setState(next: ClassState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function fromDocument(data: Record<string, unknown> | undefined): ClassSettings {
  const switches = (data?.settings ?? {}) as Record<string, unknown>;
  const flag = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
  return {
    name: typeof data?.name === 'string' && data.name.trim() ? data.name : DEFAULT_CLASS_SETTINGS.name,
    homeMessage: typeof data?.homeMessage === 'string' ? data.homeMessage : '',
    suggestionsEnabled: flag(switches.suggestionsEnabled, DEFAULT_CLASS_SETTINGS.suggestionsEnabled),
    anonymousSuggestions: flag(switches.anonymousSuggestions, DEFAULT_CLASS_SETTINGS.anonymousSuggestions),
    studentsCanPostEvents: flag(switches.studentsCanPostEvents, DEFAULT_CLASS_SETTINGS.studentsCanPostEvents),
  };
}

function start() {
  if (started) return;
  started = true;
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  if (!auth || !db) {
    setState({ settings: DEFAULT_CLASS_SETTINGS, loading: false });
    return;
  }

  // The class document is only readable when signed in.
  onAuthStateChanged(auth, async (user) => {
    const sequence = ++authSequence;
    if (!user) {
      setState({ settings: DEFAULT_CLASS_SETTINGS, loading: false });
      return;
    }
    try {
      const snapshot = await getDoc(doc(db, 'classes', DEFAULT_CLASS_ID));
      if (sequence === authSequence) setState({ settings: fromDocument(snapshot.data()), loading: false });
    } catch {
      if (sequence === authSequence) setState({ settings: DEFAULT_CLASS_SETTINGS, loading: false });
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

export function useClassSettings() {
  return useSyncExternalStore(subscribe, () => state, () => initialState);
}

/** Saves the given fields and updates every component showing them. */
export async function saveClassSettings(uid: string, changes: Partial<ClassSettings>) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not configured.');

  const switches: Record<string, boolean> = {};
  if (changes.suggestionsEnabled !== undefined) switches.suggestionsEnabled = changes.suggestionsEnabled;
  if (changes.anonymousSuggestions !== undefined) switches.anonymousSuggestions = changes.anonymousSuggestions;
  if (changes.studentsCanPostEvents !== undefined) switches.studentsCanPostEvents = changes.studentsCanPostEvents;

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString(), updatedBy: uid };
  if (changes.name !== undefined) update.name = changes.name.trim().slice(0, CLASS_NAME_MAX) || DEFAULT_CLASS_SETTINGS.name;
  if (changes.homeMessage !== undefined) update.homeMessage = changes.homeMessage.trim().slice(0, HOME_MESSAGE_MAX);
  if (Object.keys(switches).length) update.settings = switches;

  // merge keeps any other fields already on the class document.
  await setDoc(doc(db, 'classes', DEFAULT_CLASS_ID), update, { merge: true });
  setState({
    loading: false,
    settings: {
      ...state.settings,
      ...changes,
      ...(update.name !== undefined ? { name: update.name as string } : {}),
      ...(update.homeMessage !== undefined ? { homeMessage: update.homeMessage as string } : {}),
    },
  });
}
