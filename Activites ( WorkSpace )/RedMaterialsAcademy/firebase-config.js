// ================================================================
// XCELIAS ACADEMY — FIREBASE CONFIGURATION
// ================================================================
//
// HOW TO ENABLE REAL-TIME MULTI-DEVICE LEADERBOARD:
//
// STEP 1: Go to https://console.firebase.google.com
// STEP 2: "Add project" → name it "Xcelias Academy" → Continue
// STEP 3: Click the </> icon (Web App) → Register app → Copy config
// STEP 4: Paste your values into window.XCELIAS_FB_CONFIG below
// STEP 5: In Firebase Console:
//   Authentication → Sign-in method → Email/Password → Enable
//   Realtime Database → Create database → Start in test mode
//   Database Rules → paste this:
//   {
//     "rules": {
//       "users":       { ".read": "auth != null", ".write": "auth != null" },
//       "leaderboard": { ".read": "auth != null", ".write": "auth != null" },
//       "rooms":       { ".read": "auth != null", ".write": "auth != null" }
//     }
//   }
//
// If apiKey is left empty, app runs in OFFLINE mode
// (scores stored locally, leaderboard shows this device only)
// ================================================================

window.XCELIAS_FB_CONFIG = {
  apiKey:            "AIzaSyDbguvLUduOUgHVJnM6M0juFudZa5ToUYU",
  authDomain:        "xcelias-academy.firebaseapp.com",
  databaseURL:       "https://xcelias-academy-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "xcelias-academy",
  storageBucket:     "xcelias-academy.firebasestorage.app",
  messagingSenderId: "363432658541",
  appId:             "1:363432658541:web:500c0f300bb579b729e164"
};

(function () {
  var c = window.XCELIAS_FB_CONFIG;
  var ready = c && c.apiKey && c.apiKey.length > 8;
  if (ready) {
    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps || firebase.apps.length === 0) {
          firebase.initializeApp(c);
        }
        window.xcAuth = firebase.auth();
        window.xcDB   = firebase.database();
        window.xcFirebaseReady = true;
        console.log('%c[Xcelias] 🔥 Firebase LIVE — real-time sync enabled', 'color:#50fa7b;font-weight:700');
      }
    } catch (e) {
      console.warn('[Xcelias] Firebase init error:', e.message);
      window.xcFirebaseReady = false;
    }
  } else {
    window.xcFirebaseReady = false;
    console.log('%c[Xcelias] 📱 Offline mode — fill firebase-config.js to enable real-time sync', 'color:#ffb020;font-weight:700');
  }
})();
