#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   XCELIAS ADMIN RESET TOOL
   ═══════════════════════════════════════════════════════════════════
   Resets the admin password and ensures the DB profile exists.

   USAGE:
     node admin-reset.js                  (interactive)
     node admin-reset.js --password NEW   (set admin password directly)
     node admin-reset.js --list           (list all Firebase Auth users)
     node admin-reset.js --delete-admin   (delete admin, lets Training Academy re-setup)

   FIRST TIME SETUP:
     1. Go to https://console.firebase.google.com → xcelias-academy
     2. Project Settings (gear icon) → Service accounts
     3. Click "Generate new private key" → Save the JSON file
     4. Place it as:  excelias-portal/service-account.json
     5. Run this script
   ═══════════════════════════════════════════════════════════════════ */

const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');
const readline = require('readline');

/* ── Config ── */
const SA_PATH = path.join(__dirname, 'service-account.json');
const DB_URL  = 'https://xcelias-academy-default-rtdb.europe-west1.firebasedatabase.app';
const ADMIN_EMAIL = 'admin@xcelias.internal';

/* ── Helpers ── */
const log  = (m) => console.log(`  ${m}`);
const ok   = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const err  = (m) => console.error(`  ❌ ${m}`);
const line = ()  => console.log('  ' + '─'.repeat(50));

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(`  ${question}`, a => { rl.close(); resolve(a.trim()); }));
}

/* ── Init Firebase Admin ── */
function initAdmin() {
  if (!fs.existsSync(SA_PATH)) {
    err('service-account.json not found!');
    console.log('');
    log('To get it:');
    log('1. Go to https://console.firebase.google.com');
    log('2. Select "xcelias-academy" project');
    log('3. Click gear icon → Project Settings → Service accounts');
    log('4. Click "Generate new private key"');
    log(`5. Save the file as: ${SA_PATH}`);
    console.log('');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: DB_URL
  });
  return admin;
}

/* ── List all users ── */
async function listUsers() {
  log('Firebase Auth Users:');
  line();
  const result = await admin.auth().listUsers(100);
  if (!result.users.length) {
    warn('No users found in Firebase Auth');
    return;
  }
  for (const u of result.users) {
    const dbSnap = await admin.database().ref(`users/${u.uid}`).once('value');
    const profile = dbSnap.val();
    const role = profile ? profile.role : '(no DB profile)';
    log(`${u.email.padEnd(30)} uid: ${u.uid.substring(0, 12)}...  role: ${role}`);
  }
  line();
}

/* ── Ensure admin DB profile exists ── */
async function ensureAdminProfile(uid) {
  const snap = await admin.database().ref(`users/${uid}`).once('value');
  if (snap.val()) {
    ok(`Admin profile exists in DB (role: ${snap.val().role})`);
    return;
  }
  warn('Admin profile missing from Realtime Database — creating it now...');
  await admin.database().ref(`users/${uid}`).set({
    username:    'admin',
    displayName: 'Admin',
    role:        'admin',
    batchId:     'admin',
    createdAt:   Date.now()
  });
  ok('Admin profile created in Realtime Database');
}

/* ── Reset admin password ── */
async function resetAdminPassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    err('Password must be at least 6 characters');
    return false;
  }

  /* Find or create admin user */
  let adminUser;
  try {
    adminUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    ok(`Found admin account (uid: ${adminUser.uid})`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      warn('Admin account does not exist — creating it...');
      adminUser = await admin.auth().createUser({
        email:    ADMIN_EMAIL,
        password: newPassword,
        disabled: false
      });
      ok(`Created admin account (uid: ${adminUser.uid})`);
      await ensureAdminProfile(adminUser.uid);
      ok('Admin password set successfully');
      return true;
    }
    throw e;
  }

  /* Update password */
  await admin.auth().updateUser(adminUser.uid, { password: newPassword });
  ok('Admin password updated in Firebase Auth');

  /* Ensure DB profile */
  await ensureAdminProfile(adminUser.uid);
  return true;
}

/* ── Delete admin (allows Training Academy re-setup) ── */
async function deleteAdmin() {
  try {
    const adminUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    await admin.auth().deleteUser(adminUser.uid);
    await admin.database().ref(`users/${adminUser.uid}`).remove();
    ok('Admin account deleted from Auth + Database');
    ok('The Training Academy will now show "Setup Admin Account"');
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      warn('Admin account already does not exist');
    } else {
      throw e;
    }
  }
}

/* ── Ensure DB profiles for ALL auth users ── */
async function syncProfiles() {
  const result = await admin.auth().listUsers(100);
  let fixed = 0;
  for (const u of result.users) {
    const snap = await admin.database().ref(`users/${u.uid}`).once('value');
    if (!snap.val()) {
      const email = u.email || '';
      const username = email.replace('@xcelias.internal', '');
      const isAdmin = username === 'admin';
      await admin.database().ref(`users/${u.uid}`).set({
        username,
        displayName: isAdmin ? 'Admin' : username,
        role:        isAdmin ? 'admin' : 'trainee',
        batchId:     isAdmin ? 'admin' : 'default',
        createdAt:   Date.now()
      });
      ok(`Created missing profile for ${email}`);
      fixed++;
    }
  }
  if (fixed === 0) ok('All users already have DB profiles');
  else ok(`Fixed ${fixed} missing profile(s)`);
}

/* ── Main ── */
async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║      XCELIAS ADMIN RESET TOOL            ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');

  initAdmin();

  const args = process.argv.slice(2);

  /* --list */
  if (args.includes('--list')) {
    await listUsers();
    process.exit(0);
  }

  /* --delete-admin */
  if (args.includes('--delete-admin')) {
    await deleteAdmin();
    process.exit(0);
  }

  /* --sync-profiles */
  if (args.includes('--sync-profiles')) {
    await syncProfiles();
    process.exit(0);
  }

  /* --password <pw> */
  const pwIdx = args.indexOf('--password');
  if (pwIdx !== -1 && args[pwIdx + 1]) {
    const success = await resetAdminPassword(args[pwIdx + 1]);
    process.exit(success ? 0 : 1);
  }

  /* Interactive mode */
  log('What would you like to do?\n');
  log('1. Reset admin password');
  log('2. List all users');
  log('3. Sync missing DB profiles');
  log('4. Delete admin (re-setup via Training Academy)');
  console.log('');
  const choice = await ask('Choose [1-4]: ');

  switch (choice) {
    case '1': {
      const pw = await ask('New admin password (min 6 chars): ');
      await resetAdminPassword(pw);
      break;
    }
    case '2':
      await listUsers();
      break;
    case '3':
      await syncProfiles();
      break;
    case '4': {
      const confirm = await ask('Delete admin account? This cannot be undone. Type "yes": ');
      if (confirm.toLowerCase() === 'yes') await deleteAdmin();
      else warn('Cancelled');
      break;
    }
    default:
      warn('Invalid choice');
  }

  process.exit(0);
}

main().catch(e => { err(e.message); process.exit(1); });
