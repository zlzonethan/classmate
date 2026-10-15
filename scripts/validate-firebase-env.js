const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const env = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
}

const publicKeys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const adminKeys = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missingPublic = publicKeys.filter((key) => !process.env[key] && !env[key]);
const missingAdmin = adminKeys.filter((key) => !process.env[key] && !env[key]);

if (missingPublic.length || missingAdmin.length) {
  console.log('Firebase environment is not fully configured.');
  if (missingPublic.length) {
    console.log('Missing public client vars:', missingPublic.join(', '));
  }
  if (missingAdmin.length) {
    console.log('Missing server admin vars:', missingAdmin.join(', '));
  }
  console.log('Copy the values from Firebase Console or use .env.local with the needed entries.');
  process.exit(1);
}

console.log('Firebase configuration looks valid.');
console.log('Public client keys:', publicKeys.join(', '));
console.log('Admin keys:', adminKeys.join(', '));
