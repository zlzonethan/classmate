const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) return;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  });
}

function ensureAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

async function seedFirestore() {
  const app = ensureAdmin();
  const db = admin.firestore(app);
  const now = new Date().toISOString();

  const seed = {
    classes: {
      'class-demo': {
        id: 'class-demo',
        name: 'Class 101',
        timezone: 'Asia/Seoul',
        classCode: 'CLS-101',
        createdAt: now,
        updatedAt: now,
        settings: {
          defaultAiVerificationEnabled: true,
          weeklyChallengeGoal: 80,
          xpPerApprovedHomework: 30,
          earlyCompletionBonusXp: 10,
        },
      },
    },
    users: {
      'demo-student': {
        uid: 'demo-student',
        displayName: 'Kim Student',
        email: 'student@example.com',
        role: 'STUDENT',
        classId: 'class-demo',
        createdAt: now,
        updatedAt: now,
      },
      'demo-president': {
        uid: 'demo-president',
        displayName: 'Lee President',
        email: 'president@example.com',
        role: 'CLASS_PRESIDENT',
        classId: 'class-demo',
        createdAt: now,
        updatedAt: now,
      },
      'demo-teacher': {
        uid: 'demo-teacher',
        displayName: 'Park Teacher',
        email: 'teacher@example.com',
        role: 'TEACHER',
        classId: 'class-demo',
        createdAt: now,
        updatedAt: now,
      },
    },
    homework: {
      'hw-1': {
        title: 'Biology summary',
        description: 'Write a 3-paragraph summary of the cell structure lesson.',
        subjectId: 'science',
        dueDate: '2026-10-20',
        dueTime: '17:00',
        priority: 'high',
        attachmentUrls: [],
        createdBy: 'demo-president',
        createdAt: now,
        updatedAt: now,
        archived: false,
      },
    },
    announcements: {
      'announcement-1': {
        title: 'Midterm prep workshop',
        content: 'Attend the Friday review workshop and bring your notes for peer discussion.',
        pinned: true,
        attachmentUrls: [],
        createdBy: 'demo-teacher',
        createdAt: now,
        updatedAt: now,
        archived: false,
      },
    },
    events: {
      'event-1': {
        title: 'Science fair',
        description: 'Group presentations and poster display',
        date: '2026-10-18',
        time: '14:00',
        createdBy: 'demo-president',
        createdAt: now,
        updatedAt: now,
        archived: false,
      },
    },
    tests: {
      'test-1': {
        title: 'World History quiz',
        subjectId: 'history',
        testDate: '2026-10-24',
        testRange: 'Ch. 5-7',
        location: 'Room 204',
        notes: 'Bring a blue pen.',
        attachmentUrls: [],
        createdBy: 'demo-teacher',
        createdAt: now,
        updatedAt: now,
        archived: false,
      },
    },
    xpTransactions: {
      'xp-1': {
        uid: 'demo-student',
        homeworkId: 'hw-1',
        amount: 30,
        reason: 'Homework approved',
        createdAt: now,
      },
    },
    aiUsage: {
      'usage-1': {
        dateKey: new Date().toISOString().slice(0, 10),
        count: 1,
        lastUpdatedAt: now,
      },
    },
  };

  for (const [collectionName, documents] of Object.entries(seed)) {
    for (const [docId, payload] of Object.entries(documents)) {
      await db.collection(collectionName).doc(docId).set(payload, { merge: true });
    }
  }

  console.log('Firestore seed completed successfully.');
}

seedFirestore().catch((error) => {
  console.error('Firestore seed failed:', error.message || error);
  process.exit(1);
});
