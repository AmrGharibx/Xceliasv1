/* ═══════════════════════════════════════════════════════════════════════════
   XCELIAS UNIFIED AUTH MODULE  v1.0
   ═══════════════════════════════════════════════════════════════════════════
   Shared authentication guard for ALL Xcelias modules.
   Provides Firebase Auth + offline fallback with consistent UI.

   Usage:
     <script src="/xcelias-auth.js"></script>
     <script>
       XceliasAuth.guard({
         moduleName: 'Report Generator',   // shown in login subtitle
         requiredRoles: ['admin'],          // null = any authenticated user
         onReady: function(user) { ... }    // called when user is authenticated
       });
     </script>
   ═══════════════════════════════════════════════════════════════════════════ */
;(function () {
  'use strict';

  /* ── localStorage helpers ── */
  var _r = function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  var _w = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* ── SHA-256 using SubtleCrypto ── */
  var _hash = function (s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    });
  };

  /* ── Escape HTML ── */
  var _esc = function (s) { var d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; };

  /* ── Firebase email format ── */
  var _fbEmail = function (u) { return u.toLowerCase().trim() + '@xcelias.internal'; };

  /* ── Role check helper ── */
  var _roleOk = function (user, requiredRoles) {
    if (!user) return false;
    if (!requiredRoles || !requiredRoles.length) return true;
    return requiredRoles.indexOf(user.role) !== -1;
  };

  /* ═══════════════════════════════════════
     SIGN IN (Firebase + offline fallback)
     ═══════════════════════════════════════ */
  var _signIn = function (username, password, requiredRoles) {
    var u = username.toLowerCase().trim();

    /* 1 — Firebase online auth */
    if (window.xcFirebaseReady && window.xcAuth) {
      return window.xcAuth.signInWithEmailAndPassword(_fbEmail(u), password)
        .then(function (cred) {
          return window.xcDB.ref('users/' + cred.user.uid).once('value').then(function (snap) {
            var profile = snap.val();
            if (!profile) {
              /* Auto-create missing DB profile from Firebase Auth user */
              var isAdmin = u === 'admin';
              profile = { username: u, displayName: isAdmin ? 'Admin' : u, role: isAdmin ? 'admin' : 'trainee', batchId: isAdmin ? 'admin' : 'default', createdAt: Date.now() };
              window.xcDB.ref('users/' + cred.user.uid).set(profile).catch(function () {});
            }
            var user = Object.assign({ uid: cred.user.uid }, profile);
            if (!_roleOk(user, requiredRoles)) {
              return window.xcAuth.signOut().then(function () {
                throw new Error('Your account does not have access to this module. Required role: ' + (requiredRoles || []).join(' or '));
              });
            }
            _w('xcCurrentUser', user);
            return user;
          });
        })
        .catch(function (e) {
          if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
            throw new Error('Invalid username or password');
          }
          throw e;
        });
    }

    /* 2 — Offline fallback */
    return (function () {
      var adminSetup = _r('xcAdminSetup', null);
      if (u === 'admin') {
        if (!adminSetup) return Promise.reject(new Error('No admin found. Set up admin via Training Academy first.'));
        return _hash(password).then(function (h) {
          if (h !== adminSetup.passwordHash) throw new Error('Invalid username or password');
          var user = { uid: 'admin_local', username: 'admin', displayName: 'Admin', role: 'admin', batchId: 'admin' };
          if (!_roleOk(user, requiredRoles)) throw new Error('Your account does not have access to this module.');
          _w('xcCurrentUser', user);
          return user;
        });
      }
      var accounts = _r('xcAccounts', []);
      var account = accounts.find(function (a) { return (a.username || '').toLowerCase() === u; });
      if (!account) return Promise.reject(new Error('Invalid username or password'));
      return _hash(password).then(function (h) {
        if (h !== account.passwordHash) throw new Error('Invalid username or password');
        if (!_roleOk(account, requiredRoles)) throw new Error('Your account does not have access to this module.');
        _w('xcCurrentUser', account);
        return account;
      });
    })();
  };

  /* ═══════════════════════════════════════
     SIGN OUT
     ═══════════════════════════════════════ */
  var _signOut = function () {
    try { localStorage.removeItem('xcCurrentUser'); } catch (e) {}
    if (window.xcFirebaseReady && window.xcAuth) {
      window.xcAuth.signOut().catch(function () {});
    }
    location.reload();
  };

  /* ═══════════════════════════════════════
     VERIFY SESSION (Firebase or offline)
     ═══════════════════════════════════════ */
  var _verifySession = function (cur, requiredRoles, onVerified, onFailed) {
    if (!_roleOk(cur, requiredRoles)) { onFailed(); return; }

    if (window.xcFirebaseReady && window.xcAuth) {
      var unsub = window.xcAuth.onAuthStateChanged(function (fbUser) {
        unsub();
        if (fbUser) { onVerified(cur); return; }
        /* No Firebase session — check offline legitimacy */
        var adminSetup = _r('xcAdminSetup', null);
        var accounts = _r('xcAccounts', []);
        var isOfflineAdmin = cur.uid === 'admin_local' && adminSetup;
        var isOfflineAccount = accounts.some(function (a) { return a.uid === cur.uid; });
        if (isOfflineAdmin || isOfflineAccount) { onVerified(cur); }
        else { onFailed(); }
      });
    } else {
      /* Offline — trust localStorage */
      onVerified(cur);
    }
  };

  /* ═══════════════════════════════════════
     INJECT LOGIN OVERLAY (self-contained)
     ═══════════════════════════════════════ */
  var _guardId = 'xca-unified-guard';

  var _injectStyles = function () {
    if (document.getElementById('xca-styles')) return;
    var s = document.createElement('style');
    s.id = 'xca-styles';
    s.textContent = [
      '#' + _guardId + '{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;',
      'background:radial-gradient(ellipse 120% 80% at 20% 20%,rgba(102,126,234,0.18),transparent 55%),',
      'radial-gradient(ellipse 100% 80% at 80% 80%,rgba(240,147,251,0.14),transparent 55%),',
      'linear-gradient(180deg,#070710 0%,#0d0d1e 100%);',
      'padding:20px;overflow-y:auto;font-family:"Montserrat",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',

      '#' + _guardId + ' .xca-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
      '#' + _guardId + ' .xca-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.18;animation:xcaOrbF 8s ease-in-out infinite}',
      '#' + _guardId + ' .xca-orb--1{width:500px;height:500px;background:#667eea;top:-150px;left:-150px}',
      '#' + _guardId + ' .xca-orb--2{width:400px;height:400px;background:#f093fb;bottom:-100px;right:-100px;animation-delay:-3s}',
      '#' + _guardId + ' .xca-orb--3{width:300px;height:300px;background:#50fa7b;top:30%;left:40%;animation-delay:-5s}',
      '@keyframes xcaOrbF{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,30px) scale(0.95)}}',

      '#' + _guardId + ' .xca-card{position:relative;z-index:2;background:rgba(15,15,26,0.82);backdrop-filter:blur(28px);',
      'border:1px solid rgba(102,126,234,0.18);border-radius:28px;padding:48px 40px;width:100%;max-width:420px;',
      'box-shadow:0 32px 80px rgba(0,0,0,0.6),0 0 60px rgba(102,126,234,0.08);animation:xcaCardIn 0.6s cubic-bezier(0.175,0.885,0.32,1.275);margin:auto}',
      '@keyframes xcaCardIn{from{opacity:0;transform:translateY(32px) scale(0.95)}to{opacity:1;transform:none}}',

      '#' + _guardId + ' .xca-logo{position:relative;width:80px;height:80px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;overflow:visible}',
      '#' + _guardId + ' .xca-ring{position:absolute;border-radius:50%;border:2px solid transparent;pointer-events:none}',
      '#' + _guardId + ' .xca-ring--o{inset:-12px;background:linear-gradient(#0f0f1a,#0f0f1a) padding-box,linear-gradient(135deg,#667eea,#f093fb,#50fa7b,#667eea) border-box;animation:xcaRS 5s linear infinite}',
      '#' + _guardId + ' .xca-ring--i{inset:-4px;border-width:1px;background:linear-gradient(#0f0f1a,#0f0f1a) padding-box,linear-gradient(225deg,#667eea 0%,#764ba2 100%) border-box;animation:xcaRS 8s linear infinite reverse}',
      '#' + _guardId + ' .xca-lorb{position:absolute;border-radius:50%;pointer-events:none;width:10px;height:10px}',
      '#' + _guardId + ' .xca-lorb--1{background:#667eea;box-shadow:0 0 12px 4px rgba(102,126,234,0.8);animation:xcaO1 2.5s linear infinite}',
      '#' + _guardId + ' .xca-lorb--2{background:#f093fb;box-shadow:0 0 12px 4px rgba(240,147,251,0.8);animation:xcaO2 3.8s linear infinite}',
      '#' + _guardId + ' .xca-lorb--3{background:#50fa7b;box-shadow:0 0 10px 3px rgba(80,250,123,0.7);animation:xcaO3 5s linear infinite reverse}',
      '@keyframes xcaO1{0%{transform:translate(0,-44px)}25%{transform:translate(44px,0)}50%{transform:translate(0,44px)}75%{transform:translate(-44px,0)}100%{transform:translate(0,-44px)}}',
      '@keyframes xcaO2{0%{transform:translate(44px,0)}25%{transform:translate(0,44px)}50%{transform:translate(-44px,0)}75%{transform:translate(0,-44px)}100%{transform:translate(44px,0)}}',
      '@keyframes xcaO3{0%{transform:translate(-32px,-32px)}50%{transform:translate(32px,32px)}100%{transform:translate(-32px,-32px)}}',
      '@keyframes xcaRS{to{transform:rotate(360deg)}}',
      '#' + _guardId + ' .xca-svg{width:52px;height:52px;position:relative;z-index:2;animation:xcaBreath 3s ease-in-out infinite}',
      '@keyframes xcaBreath{0%,100%{filter:drop-shadow(0 0 8px rgba(102,126,234,0.4));transform:scale(1)}50%{filter:drop-shadow(0 0 22px rgba(240,147,251,0.7)) drop-shadow(0 0 40px rgba(102,126,234,0.3));transform:scale(1.06)}}',

      '#' + _guardId + ' .xca-title{text-align:center;margin-bottom:32px}',
      '#' + _guardId + ' .xca-title-x{display:block;font-size:32px;font-weight:900;letter-spacing:-1px;background:linear-gradient(135deg,#fff 0%,#667eea 50%,#f093fb 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}',
      '#' + _guardId + ' .xca-title-sub{display:block;font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(152,152,184,0.7);margin-top:4px}',

      '#' + _guardId + ' .xca-form{display:flex;flex-direction:column;gap:16px}',
      '#' + _guardId + ' .xca-field{display:flex;flex-direction:column;gap:6px}',
      '#' + _guardId + ' .xca-label{font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:rgba(152,152,184,0.8)}',
      '#' + _guardId + ' .xca-input{background:rgba(255,255,255,0.05);border:1px solid rgba(102,126,234,0.2);border-radius:14px;padding:14px 16px;color:rgba(232,232,240,0.94);font-size:15px;font-family:"Montserrat",sans-serif;font-weight:500;outline:none;transition:border-color 0.2s,box-shadow 0.2s;width:100%;box-sizing:border-box}',
      '#' + _guardId + ' .xca-input:focus{border-color:rgba(102,126,234,0.5);box-shadow:0 0 0 3px rgba(102,126,234,0.12)}',
      '#' + _guardId + ' .xca-input::placeholder{color:rgba(152,152,184,0.4)}',
      '#' + _guardId + ' .xca-pw-wrap{position:relative}',
      '#' + _guardId + ' .xca-pw-wrap .xca-input{padding-right:48px}',
      '#' + _guardId + ' .xca-pw-tog{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;line-height:1;color:rgba(152,152,184,0.6);padding:4px;transition:color 0.2s}',
      '#' + _guardId + ' .xca-pw-tog:hover{color:rgba(232,232,240,0.8)}',
      '#' + _guardId + ' .xca-err{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:12px;padding:12px 16px;font-size:13px;color:#f87171;text-align:center;display:none}',
      '#' + _guardId + ' .xca-btn{padding:16px 24px;border-radius:16px;border:1px solid rgba(102,126,234,0.2);cursor:pointer;font-family:"Montserrat",sans-serif;font-size:15px;font-weight:700;background:rgba(255,255,255,0.08);color:rgba(232,232,240,0.9);transition:all 0.2s;text-align:center;width:100%}',
      '#' + _guardId + ' .xca-btn:disabled{opacity:0.6;cursor:not-allowed}',
      '#' + _guardId + ' .xca-btn--pri{background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%);background-size:200% auto;color:#fff;border:none;box-shadow:0 8px 24px rgba(102,126,234,0.35);animation:xcaBtnS 3s linear infinite}',
      '@keyframes xcaBtnS{0%{background-position:0% center}100%{background-position:200% center}}',
      '#' + _guardId + ' .xca-btn--pri:not(:disabled):hover{box-shadow:0 12px 32px rgba(102,126,234,0.5);transform:translateY(-2px) scale(1.01)}',
      '#' + _guardId + ' .xca-hint{text-align:center;font-size:12px;color:rgba(152,152,184,0.5);margin-top:16px}',
      '@media(max-width:480px){#' + _guardId + ' .xca-card{padding:32px 20px;border-radius:20px}}',
      '@media print{#' + _guardId + '{display:none!important}}'
    ].join('\n');
    document.head.appendChild(s);
  };

  var _injectHTML = function (moduleName) {
    var el = document.createElement('div');
    el.id = _guardId;
    el.innerHTML = [
      '<div class="xca-bg">',
      '  <div class="xca-orb xca-orb--1"></div>',
      '  <div class="xca-orb xca-orb--2"></div>',
      '  <div class="xca-orb xca-orb--3"></div>',
      '</div>',
      '<div class="xca-card">',
      '  <div class="xca-logo">',
      '    <div class="xca-ring xca-ring--o"></div>',
      '    <div class="xca-ring xca-ring--i"></div>',
      '    <div class="xca-lorb xca-lorb--1"></div>',
      '    <div class="xca-lorb xca-lorb--2"></div>',
      '    <div class="xca-lorb xca-lorb--3"></div>',
      '    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" class="xca-svg">',
      '      <defs><linearGradient id="xca_lg" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#667eea"/><stop offset="50%" stop-color="#764ba2"/><stop offset="100%" stop-color="#f093fb"/></linearGradient></defs>',
      '      <rect x="4" y="4" width="48" height="48" rx="14" stroke="url(#xca_lg)" stroke-width="2.5" fill="none"/>',
      '      <text x="28" y="37" text-anchor="middle" fill="url(#xca_lg)" font-family="Montserrat" font-weight="900" font-size="26">X</text>',
      '    </svg>',
      '  </div>',
      '  <div class="xca-title">',
      '    <span class="xca-title-x">Xcelias</span>',
      '    <span class="xca-title-sub">' + _esc(moduleName || 'Portal') + '</span>',
      '  </div>',
      '  <div class="xca-err" id="xca-err"></div>',
      '  <form id="xca-form" class="xca-form" novalidate>',
      '    <div class="xca-field">',
      '      <label class="xca-label" for="xca-user">Username</label>',
      '      <input class="xca-input" type="text" id="xca-user" placeholder="Enter your username" autocapitalize="none" autocorrect="off" spellcheck="false" />',
      '    </div>',
      '    <div class="xca-field">',
      '      <label class="xca-label" for="xca-pass">Password</label>',
      '      <div class="xca-pw-wrap">',
      '        <input class="xca-input" type="password" id="xca-pass" placeholder="Enter your password" autocomplete="off" />',
      '        <button type="button" id="xca-tog" class="xca-pw-tog" aria-label="Show password">\uD83D\uDC41</button>',
      '      </div>',
      '    </div>',
      '    <button type="submit" id="xca-sub" class="xca-btn xca-btn--pri">\u26A1 Sign In</button>',
      '  </form>',
      '  <p class="xca-hint">Use your Xcelias Training Academy credentials</p>',
      '</div>'
    ].join('\n');
    document.body.insertBefore(el, document.body.firstChild);
    return el;
  };

  var _removeGuard = function () {
    var el = document.getElementById(_guardId);
    if (!el) return;
    el.style.transition = 'opacity 0.35s ease';
    el.style.opacity = '0';
    setTimeout(function () { el.remove(); }, 360);
  };

  var _bindForm = function (requiredRoles) {
    var form   = document.getElementById('xca-form');
    var errEl  = document.getElementById('xca-err');
    var subEl  = document.getElementById('xca-sub');
    var userEl = document.getElementById('xca-user');
    var passEl = document.getElementById('xca-pass');
    var togEl  = document.getElementById('xca-tog');
    if (!form) return;

    if (togEl) togEl.addEventListener('click', function () {
      passEl.type = passEl.type === 'password' ? 'text' : 'password';
      togEl.textContent = passEl.type === 'password' ? '\uD83D\uDC41' : '\uD83D\uDE48';
    });

    var showErr = function (m) { if (errEl) { errEl.textContent = m; errEl.style.display = m ? 'block' : 'none'; } };
    var setLoad = function (on) { if (subEl) { subEl.disabled = on; subEl.textContent = on ? '\u00B7 \u00B7 \u00B7' : '\u26A1 Sign In'; } };

    setTimeout(function () { if (userEl) userEl.focus(); }, 400);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var uname = (userEl ? userEl.value : '').trim();
      var pw = passEl ? passEl.value : '';
      if (!uname || !pw) { showErr('Enter username and password'); return; }
      setLoad(true);
      showErr('');
      _signIn(uname, pw, requiredRoles)
        .then(function (user) {
          _removeGuard();
          if (window._xcaOnReady) window._xcaOnReady(user);
        })
        .catch(function (err) { showErr(err.message || 'Login failed'); })
        .finally(function () { setLoad(false); });
    });
  };

  /* ═══════════════════════════════════════════════════════════════
     PUBLIC API: XceliasAuth.guard(config)
     ═══════════════════════════════════════════════════════════════ */
  window.XceliasAuth = {
    /**
     * guard({ moduleName, requiredRoles, onReady })
     *  - moduleName:    string  — shown in login card subtitle
     *  - requiredRoles: array|null — e.g. ['admin','agent']. null = any user
     *  - onReady:       fn(user) — called once user is verified
     */
    guard: function (config) {
      config = config || {};
      var moduleName = config.moduleName || 'Portal';
      var requiredRoles = config.requiredRoles || null;
      window._xcaOnReady = config.onReady || null;

      var cur = _r('xcCurrentUser', null);

      /* Already logged in — verify */
      if (cur && _roleOk(cur, requiredRoles)) {
        _verifySession(cur, requiredRoles, function (user) {
          /* Verified — no guard needed */
          if (config.onReady) config.onReady(user);
        }, function () {
          /* Invalid session — wipe and reload */
          try { localStorage.removeItem('xcCurrentUser'); } catch (e) {}
          location.reload();
        });
        return;
      }

      /* Not logged in or wrong role — show login overlay */
      _injectStyles();
      _injectHTML(moduleName);
      _bindForm(requiredRoles);
    },

    /** Get current user from localStorage */
    currentUser: function () { return _r('xcCurrentUser', null); },

    /** Sign out and reload */
    signOut: _signOut,

    /** Check if user has required role */
    hasRole: function (user, roles) { return _roleOk(user, roles); },

    /** Email format */
    fbEmail: _fbEmail
  };
})();
