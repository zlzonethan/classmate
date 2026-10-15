# Classmate

AI-powered class homework and productivity platform for a shared classroom environment.

## Features implemented

- Modern Next.js dashboard for class activity and overview
- Role-aware structure for students, class presidents, and teachers
- Homework, tests, reminders, announcements, and calendar concepts
- Secure server-side AI verification route using schema validation
- Firebase-ready architecture and configuration patterns
- Environment-variable configuration guidance for AI and Firebase

## Local development

```bash
npm install
npm run dev
```

## Required environment variables

Create a `.env.local` file with the following variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
CLASSMATE_DEFAULT_TIMEZONE=Asia/Seoul
```

The app intentionally does not expose privileged keys in the browser and keeps Gemini calls server-side.

## Google sign-in

Google sign-in is supported through Firebase Authentication. In Firebase Console, enable the Google provider under **Authentication → Sign-in method** and add your local/deployed hostnames under **Authentication → Settings → Authorized domains**. The sign-in screen then uses the same Firebase client configuration as email/password authentication.

New accounts receive the default `STUDENT` role. Assigning teacher or class-president roles must be done through a trusted administrative process; users cannot grant those roles to themselves.

## Secure backend guidance

- Firebase Admin is initialized only when the required server credentials are present.
- Protected server routes such as `/api/homework` expect a valid Firebase ID token in the `Authorization: Bearer ...` header.
- Role checks are enforced on the server, not hidden in the UI.
- Missing credentials trigger a clear 401/403/503 response rather than a misleading success path.

## Firestore setup

The project now includes a production-ready Firestore security configuration and a seed helper for the default class model:

- `firestore.rules` — base access rules for users, classes, homework, announcements, tests, events, XP transactions, and AI usage
- `firestore.indexes.json` — default composite indexes for common class-app queries
- `scripts/seed-firestore.js` — bootstraps initial demo data into a Firebase project once admin credentials are configured

To initialize the Firestore demo data:

```bash
node scripts/seed-firestore.js
```

This script expects the same server-side Firebase admin variables as the rest of the app. It exits safely if the credentials are not configured yet.

## AI verification policy

- Maximum 50 AI verification checks per day on the server
- Requests rejected before the model do not count toward the daily limit
- Every actual model request counts as one usage attempt
- Failed/incomplete AI calls remain visible as honest status, never as a successful approval
- AI is treated as an evidence-checking assistant, not a source of truth for authorship or misconduct
