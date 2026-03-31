# Xcelias Academy Firebase Setup

This file explains exactly what you need to do on your side so the Academy app works across multiple devices with one admin, shared trainee accounts, shared leaderboard, and shared rooms.

## What Firebase Is

Firebase is Google's hosted backend.

For your Academy app, it gives you:
- One shared admin account across devices
- Shared trainee accounts across devices
- Shared leaderboard across devices
- Shared room codes across devices
- Real-time sync without manually exporting backups

Without Firebase, the app uses each device's browser storage separately.
That is why a second device looks like a fresh install.

## What You Need Before Starting

- A Google account
- 10 to 15 minutes
- Your app running from the updated Academy folder
- All devices on the same Wi-Fi if you want to test locally in class

## Important First Decision

You have 2 ways to use the Academy app on multiple devices:

### Option 1: Same Wi-Fi classroom, no public deployment

Use the network address of your computer, not `localhost`.

Example from your local server output:
- `http://192.168.0.199:3000`

If students are on the same Wi-Fi, they should open that network address on their phones, not `http://localhost:3000`.

Why:
- `localhost` on your phone means the phone itself, not your computer.

### Option 2: Public deployment

Host the updated Academy app online so everyone opens the same live URL.

If you go this route, make sure the deployed version includes:
- `app.jsx`
- `index.html`
- `firebase-config.js`

## Step 1: Create a Firebase Project

1. Open: `https://console.firebase.google.com/`
2. Click `Create a project`
3. Project name: `Xcelias Academy`
4. Continue through the setup
5. Google Analytics is optional for this app. You can disable it if you want.
6. Wait for the project to finish creating

## Step 2: Add a Web App Inside Firebase

1. Inside the Firebase project, click the `</>` icon for `Web`
2. App nickname: `Xcelias Academy Web`
3. Do not worry about Firebase Hosting for now
4. Click `Register app`
5. Firebase will show you a config object that looks like this:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Keep that window open.

## Step 3: Enable Email/Password Login

1. In Firebase left menu, open `Build` -> `Authentication`
2. Click `Get started`
3. Open the `Sign-in method` tab
4. Click `Email/Password`
5. Turn on `Email/Password`
6. Save

## Step 4: Create the Realtime Database

1. In Firebase left menu, open `Build` -> `Realtime Database`
2. Click `Create Database`
3. Pick a region close to you
4. Choose `Start in test mode`
5. Create it

## Step 5: Set Database Rules

After the database is created:

1. Open the `Rules` tab inside Realtime Database
2. Replace the rules with this:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "leaderboard": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "rooms": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

3. Click `Publish`

## Step 6: Copy the Firebase Config Into the App

Open this file:

- `Activites ( WorkSpace )/RedMaterialsAcademy/firebase-config.js`

Replace the empty values in `window.XCELIAS_FB_CONFIG` with the values from Firebase.

Example:

```js
window.XCELIAS_FB_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId:             "1:1234567890:web:abcdef123456"
};
```

Save the file.

## Step 7: Restart or Refresh the App

After saving `firebase-config.js`:

1. Refresh the Academy app on your computer
2. Refresh it on every phone/device
3. You should no longer see the offline warning

## Step 8: Create the Admin Once, While Firebase Is Live

After Firebase is connected:

1. Open the app
2. Create the admin account once
3. That admin will now live in Firebase, not only on one device
4. On another device, use the same admin username/password to sign in

Expected result:
- The second device should show the login screen, not "create admin again"
- The admin you created on the first device should work everywhere

## Step 9: Create Trainee Accounts

Once logged in as admin:

1. Open `Admin`
2. Open `Accounts`
3. Add trainees
4. Share each trainee's username and password with them

Expected result:
- Trainees can log in from any device using those credentials
- Scores sync to the same leaderboard

## Step 10: Test Rooms and Leaderboard

1. On admin device, create a room
2. On trainee devices, join the room with the code
3. Play an activity on one device
4. Confirm the leaderboard updates on another device

## What To Do With Your Current Offline Setup

Right now you may already have:
- an admin on one device
- some local trainee accounts on one device

You have 2 choices:

### Simple choice

After Firebase is configured, create the admin again under Firebase and recreate trainees there.

This is the cleanest option.

### Temporary choice

If you need another device before Firebase is ready:

1. On the original device, open `Admin` -> `Accounts`
2. Click `Export Device Backup`
3. Move that JSON file to the second device
4. On the second device login screen, click `Import Offline Backup`
5. Import the file
6. Sign in with the same admin password from the original device

This is only a temporary offline workaround.
It is not real live sync.

## If Students Still Cannot Open the App

Check these in order:

1. They are opening the same URL as you
2. If testing locally, they are using your computer's network IP, not `localhost`
3. All devices are on the same Wi-Fi
4. Your Windows firewall is not blocking the local server
5. The updated `firebase-config.js` is present in the running version of the app

## If You Want Me To Finish The Rest

I cannot create the Firebase project under your Google account from here.

But I can do the rest immediately if you send me the config values from Firebase.

Send me this filled object and I will wire it correctly:

```js
window.XCELIAS_FB_CONFIG = {
  apiKey:            "",
  authDomain:        "",
  databaseURL:       "",
  projectId:         "",
  storageBucket:     "",
  messagingSenderId: "",
  appId:             ""
};
```

After you send that, I can:
- put it into the app
- verify the app connects
- test the login flow again
- tell you exactly what to click next