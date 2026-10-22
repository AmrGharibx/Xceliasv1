import {encodeBase64Url} from '../modules/qr-attendance-core.mjs';

const LEGACY_DB_NAME = 'red-academy-qr-attendance-v1';
const IDENTITY_DB_NAME = 'red-academy-qr-device-identity-v1';
const LEGACY_STORE = 'enrollments';
const IDENTITY_STORE = 'identity';
const IDENTITY_KEY = 'origin';
const IDENTITY_LOCK_KEY = 'device-link-request-lock';
const STATUS_POLL_MS = 5000;

const page = {
  title: document.getElementById('page-title'),
  intro: document.getElementById('intro'),
  notice: document.getElementById('location-notice'),
  privacy: document.getElementById('connection-privacy-note'),
  session: document.getElementById('session-pill'),
  form: document.getElementById('link-form'),
  modeLabel: document.getElementById('verification-mode-label'),
  mode: document.getElementById('verification-kind'),
  value: document.getElementById('verification-value'),
  valueLabel: document.getElementById('verification-label'),
  valueHelp: document.getElementById('verification-help'),
  activate: document.getElementById('link-device-button'),
  bound: document.getElementById('bound-state'),
  name: document.getElementById('trainee-name'),
  boundHelp: document.getElementById('bound-help'),
  checkin: document.getElementById('check-in-button'),
  replacement: document.getElementById('replace-device'),
  pending: document.getElementById('pending-state'),
  pendingTitle: document.getElementById('pending-title'),
  pendingCopy: document.getElementById('pending-copy'),
  recovery: document.getElementById('recovery-state'),
  recoveryTitle: document.getElementById('recovery-title'),
  recoveryCopy: document.getElementById('recovery-copy'),
  feedback: document.getElementById('feedback'),
  loading: document.getElementById('loading-indicator'),
  lang: document.getElementById('language-toggle'),
  footer: document.getElementById('footer-copy'),
  eyebrow: document.getElementById('eyebrow'),
};

const strings = {
  en: {
    loading: 'Loading your batch…',
    intro: 'Checking the active training session securely.',
    invalid: 'This attendance QR is invalid or has been replaced. Please ask reception for the current pass.',
    inactive: 'This batch is not accepting QR attendance right now. Ask your trainer.',
    waiting: 'Your trainer has not opened today’s attendance yet. Keep this page open or try again shortly.',
    waitingIntro: 'Your batch is connected. Attendance becomes available when your trainer opens today’s session.',
    openIntro: 'Today’s attendance session is open. Link this browser once, then wait for your trainer to approve it.',
    notice: 'Your location is checked only when you tap “I’m here” to confirm you are near the Academy. Your exact location is checked securely and is not stored. An uncertain or outside result is sent to staff review—not marked absent. If location is unavailable while you are on-site, speak to reception.',
    privacy: 'Hosting and security systems may process connection metadata to protect the service from abuse.',
    modeLabel: 'Choose how to verify your trainee record',
    phoneOption: 'Phone number',
    codeOption: 'Reception code',
    phoneLabel: 'Phone number saved with your trainee record',
    phoneHelp: 'Use the number you gave the Academy. Your number is used only to find a possible record and is not saved on this device.',
    codeLabel: 'Your private reception code',
    codeHelp: 'Enter the one-time code reception gave you in person. The code is not saved on this device.',
    activate: 'Link this phone',
    checking: 'Sending request…',
    checkin: 'I’m here',
    linkedHelp: 'This browser is linked to your trainee record. You can record yourself once for today.',
    success: 'You’re checked in. Your arrival time has been recorded.',
    already: 'You’re already checked in for today.',
    review: 'We couldn’t verify that you’re near the Academy, so attendance wasn’t recorded automatically. Your attempt is waiting for staff review. If you’re on-site, please contact reception.',
    denied: 'Location access is off. Turn it on and try again, or ask reception to record your attendance manually.',
    unavailable: 'Your location is unavailable right now. If you’re at the Academy, ask reception for help; no absence has been recorded.',
    timeout: 'Location took too long to respond. Try again near a window or ask reception for help.',
    codeInvalid: 'We couldn’t use those details. Check them with reception and try again.',
    requestFailed: 'We couldn’t send the request. Check your connection and try again; if it continues, ask reception for help.',
    rateLimited: 'Too many attempts were made. Wait a little, then try again or ask reception for help.',
    deviceLost: 'This browser no longer has an active attendance link. Ask reception for a replacement code.',
    pendingTitle: 'Waiting for trainer approval',
    pendingCopy: 'Your request was sent. Keep this page open; your name and check-in stay private until your trainer approves the link.',
    requestPendingTitle: 'A previous request is waiting for your trainer',
    requestPendingCopy: 'A request from this browser is already waiting. Ask the trainer or reception to find and resolve it before starting another link.',
    requestRetry: 'We could not confirm the request. Enter your details again; this browser will safely retry the same request.',
    freshRequest: 'That request expired. Try again to start a fresh device request. Your phone has not been linked.',
    rejectedTitle: 'The request was not approved',
    rejectedCopy: 'Please speak with reception or your trainer before trying again.',
    expiredTitle: 'This request has expired',
    expiredCopy: 'Ask reception to confirm you are here, then submit a new request.',
    conflictTitle: 'Reception can help secure this device',
    conflictCopy: 'This browser has older attendance links that cannot be safely matched automatically. Please show reception this screen; no name was selected and no attendance was recorded.',
    otherBatchTitle: 'This browser is already linked',
    otherBatchCopy: 'For your privacy, one browser profile cannot switch to another trainee or batch. Ask reception to help if this is the wrong link.',
    replacement: 'Reception gave me a replacement code',
    replacementPrompt: 'Enter the new phone number or reception code. Your previous link remains unchanged until a trainer approves the replacement.',
    footer: 'Your attendance details are private to you and your training team.',
    switch: 'العربية',
    batch: 'Batch',
    day: 'Training session',
    offline: 'You appear to be offline. Check your connection and try again.',
    technical: 'We couldn’t connect to attendance. Please try again or ask reception for help.',
    languageLabel: 'Switch language to Arabic',
  },
  ar: {
    loading: 'بنحمّل بيانات دفعتك…',
    intro: 'بنتأكد من جلسة التدريب المفتوحة بشكل آمن.',
    invalid: 'كود الـ QR ده مش صالح أو اتغيّر. اسأل الاستقبال على النسخة الحالية.',
    inactive: 'تسجيل الحضور للدفعة دي مش مفتوح دلوقتي. اسأل المدرب.',
    waiting: 'المدرب لسه ما فتحش تسجيل حضور النهارده. سيب الصفحة مفتوحة أو جرّب كمان شوية.',
    waitingIntro: 'وصلنا لدفعتك. تسجيل الحضور هيظهر أول ما المدرب يفتح جلسة النهارده.',
    openIntro: 'جلسة الحضور مفتوحة النهارده. اربط الموبايل ده مرة واحدة واستنى موافقة المدرب.',
    notice: 'الموقع بيتراجع بس لما تدوس «أنا وصلت» عشان نتأكد إنك قريب من الأكاديمية. موقعك الدقيق بيتراجع بأمان ومش بيتخزن. لو الموقع مش واضح أو بعيد، المحاولة بتروح لمراجعة فريق التدريب ومش بتتسجل غياب. لو إنت في الأكاديمية والموقع مش شغال، كلم الاستقبال.',
    privacy: 'قد تعالج أنظمة الاستضافة والأمان بيانات الاتصال للمساعدة في حماية الخدمة من إساءة الاستخدام.',
    modeLabel: 'اختار طريقة التأكد من بياناتك',
    phoneOption: 'رقم الموبايل',
    codeOption: 'كود الاستقبال',
    phoneLabel: 'رقم الموبايل المسجل مع بياناتك',
    phoneHelp: 'استخدم الرقم اللي سجلته في الأكاديمية. الرقم بيتستخدم بس عشان نلاقي بيانات ممكنة ومش بيتحفظ على الموبايل ده.',
    codeLabel: 'الكود الخاص بيك من الاستقبال',
    codeHelp: 'اكتب الكود اللي الاستقبال سلمهولك بنفسه. الكود مش بيتحفظ على الموبايل ده.',
    activate: 'اربط الموبايل ده',
    checking: 'بنبعت الطلب…',
    checkin: 'أنا وصلت',
    linkedHelp: 'الموبايل ده مربوط ببياناتك. تقدر تسجل حضورك مرة واحدة النهارده.',
    success: 'تم تسجيل حضورك، ووقت الوصول اتسجل.',
    already: 'حضورك متسجل بالفعل النهارده.',
    review: 'ما قدرناش نتأكد إنك قريب من الأكاديمية، فالحضور ما اتسجلش تلقائي. المحاولة بقت مستنية مراجعة فريق التدريب. لو إنت موجود، كلم الاستقبال.',
    denied: 'صلاحية الموقع مقفولة. فعّلها وجرّب تاني، أو اطلب من الاستقبال تسجيل حضورك يدويًا.',
    unavailable: 'مش قادرين نحدد موقعك دلوقتي. لو إنت في الأكاديمية، كلم الاستقبال؛ مفيش غياب اتسجل عليك.',
    timeout: 'تحديد الموقع أخد وقت طويل. جرّب جنب شباك أو اطلب مساعدة الاستقبال.',
    codeInvalid: 'ما قدرناش نستخدم البيانات دي. راجعها مع الاستقبال وجرّب تاني.',
    requestFailed: 'ما قدرناش نبعت الطلب. اتأكد من الاتصال وجرّب تاني، ولو المشكلة مستمرة كلم الاستقبال.',
    rateLimited: 'فيه محاولات كتير. استنى شوية وجرّب تاني أو كلم الاستقبال.',
    deviceLost: 'الربط الآمن بالموبايل ده مش موجود دلوقتي. اطلب من الاستقبال كود بديل.',
    pendingTitle: 'مستنيين موافقة المدرب',
    pendingCopy: 'طلبك اتبعت. سيب الصفحة مفتوحة؛ اسمك وتسجيل حضورك هيفضلوا مخفيين لحد ما المدرب يوافق على الربط.',
    requestPendingTitle: 'فيه طلب سابق مستني موافقة المدرب',
    requestPendingCopy: 'فيه طلب من المتصفح ده مستني المراجعة. كلم المدرب أو الاستقبال عشان يلاقوه ويحددوا حالته قبل ما تبدأ ربط جديد.',
    requestRetry: 'ما قدرناش نتأكد إن الطلب وصل. اكتب بياناتك تاني؛ المتصفح هيعيد نفس الطلب بأمان.',
    freshRequest: 'الطلب ده انتهى. جرّب تاني عشان تبدأ طلب جديد؛ الموبايل لسه مش مربوط.',
    rejectedTitle: 'الطلب ما اتوافقش عليه',
    rejectedCopy: 'اتكلم مع الاستقبال أو المدرب قبل ما تحاول تاني.',
    expiredTitle: 'الطلب انتهت صلاحيته',
    expiredCopy: 'خلي الاستقبال يتأكد إنك موجود، وبعدها ابعت طلب جديد.',
    conflictTitle: 'الاستقبال هيساعدك تأمّن الموبايل ده',
    conflictCopy: 'على الموبايل ده روابط حضور قديمة ومش ممكن نحدد الصح منها بأمان لوحدنا. ورّي الشاشة دي للاستقبال؛ ما اخترناش اسم وما اتسجلش حضور.',
    otherBatchTitle: 'الموبايل ده مربوط بالفعل',
    otherBatchCopy: 'عشان نحافظ على خصوصيتك، نفس المتصفح ما يقدرش يبدّل لشخص أو دفعة تانية. لو ده مش الرابط الصح، كلم الاستقبال.',
    replacement: 'الاستقبال اداني كود بديل',
    replacementPrompt: 'اكتب رقم الموبايل الجديد أو كود الاستقبال. الربط القديم هيفضل شغال لحد ما المدرب يوافق على البديل.',
    footer: 'بيانات حضورك خاصة بيك وبفريق التدريب.',
    switch: 'English',
    batch: 'دفعة',
    day: 'جلسة التدريب',
    offline: 'الإنترنت مش متصل. اتأكد من الاتصال وجرّب تاني.',
    technical: 'ما قدرناش نوصل لتسجيل الحضور. جرّب تاني أو كلم الاستقبال.',
    languageLabel: 'التبديل للإنجليزي',
  },
};

let language = 'en';
let batchQrId = '';
let batchName = '';
let currentSession = null;
let identity = null;
let isBusy = false;
let hasCheckedIn = false;
let deviceNeedsReplacement = false;
let recordedElsewhere = false;
let pollTimer = null;
let pollController = null;
let pollInFlight = false;

function isValidLegacyEnrollment(record) {
  return Boolean(
    record &&
      typeof record.batchQrId === 'string' &&
      record.batchQrId.length >= 16 &&
      typeof record.credentialId === 'string' &&
      record.credentialId.length > 0 &&
      typeof record.traineeName === 'string' &&
      record.traineeName.trim().length > 0 &&
      record.privateKey?.type === 'private' &&
      record.privateKey?.algorithm?.name === 'ECDSA' &&
      record.privateKey?.algorithm?.namedCurve === 'P-256',
  );
}

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDENTITY_DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (event.oldVersion === 0) db.createObjectStore(IDENTITY_STORE, {keyPath: 'id'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Private device storage is unavailable.'));
  });
}

function readLegacyEnrollments() {
  return new Promise((resolve) => {
    const request = indexedDB.open(LEGACY_DB_NAME, 1);
    request.onupgradeneeded = () => {};
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LEGACY_STORE)) {
        db.close();
        resolve([]);
        return;
      }
      const transaction = db.transaction(LEGACY_STORE, 'readonly');
      const recordsRequest = transaction.objectStore(LEGACY_STORE).getAll();
      recordsRequest.onsuccess = () => resolve(recordsRequest.result || []);
      recordsRequest.onerror = () => resolve([]);
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        resolve([]);
      };
    };
  });
}

async function storeIdentityIfMissing(record) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE, 'readwrite');
    const store = transaction.objectStore(IDENTITY_STORE);
    const existingRequest = store.get(IDENTITY_KEY);
    let result = record;
    existingRequest.onsuccess = () => {
      if (existingRequest.result) result = existingRequest.result;
      else store.put({...record, id: IDENTITY_KEY});
    };
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(new Error('Private device storage is unavailable.'));
    };
  });
}

async function readIdentity() {
  const db = await database();
  const stored = await new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE, 'readonly');
    const request = transaction.objectStore(IDENTITY_STORE).get(IDENTITY_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Private device storage is unavailable.'));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(new Error('Private device storage is unavailable.'));
    };
  });
  if (stored) return stored;

  const legacyRecords = await readLegacyEnrollments();
  if (legacyRecords.length > 1) {
    return storeIdentityIfMissing({id: IDENTITY_KEY, state: 'legacy-conflict', legacyCount: legacyRecords.length});
  }
  if (legacyRecords.length === 1 && isValidLegacyEnrollment(legacyRecords[0])) {
    return storeIdentityIfMissing({...legacyRecords[0], id: IDENTITY_KEY, state: 'approved', migratedFromLegacy: true});
  }
  return null;
}

async function saveIdentity(record) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE, 'readwrite');
    transaction.objectStore(IDENTITY_STORE).put({...record, id: IDENTITY_KEY});
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(new Error('Private device storage is unavailable.'));
    };
  });
}

async function saveIdentityForPendingRequest(record, nextIdentity) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IDENTITY_STORE, 'readwrite');
    const store = transaction.objectStore(IDENTITY_STORE);
    const current = store.get(IDENTITY_KEY);
    let saved = null;
    current.onsuccess = () => {
      const latest = current.result;
      if (latest?.state === 'pending' && latest.pendingBatchQrId === record.pendingBatchQrId && latest.requestHandle === record.requestHandle) {
        saved = {...nextIdentity, id: IDENTITY_KEY};
        store.put(saved);
      }
    };
    transaction.oncomplete = () => {
      db.close();
      resolve(saved);
    };
    transaction.onerror = transaction.onabort = () => {
      db.close();
      reject(new Error('Private device storage is unavailable.'));
    };
  });
}

async function acquireIdentityLock() {
  const token = encodeBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    const db = await database();
    const acquired = await new Promise((resolve, reject) => {
      const transaction = db.transaction(IDENTITY_STORE, 'readwrite');
      const store = transaction.objectStore(IDENTITY_STORE);
      const current = store.get(IDENTITY_LOCK_KEY);
      let claimed = false;
      current.onsuccess = () => {
        if (!current.result || current.result.expiresAt <= Date.now()) {
          store.put({id: IDENTITY_LOCK_KEY, token, expiresAt: Date.now() + 60000});
          claimed = true;
        }
      };
      transaction.oncomplete = () => {
        db.close();
        resolve(claimed);
      };
      transaction.onerror = transaction.onabort = () => {
        db.close();
        reject(new Error('Private device storage is unavailable.'));
      };
    });
    if (acquired) {
      return async () => {
        const releaseDb = await database();
        await new Promise((resolve, reject) => {
          const transaction = releaseDb.transaction(IDENTITY_STORE, 'readwrite');
          const store = transaction.objectStore(IDENTITY_STORE);
          const current = store.get(IDENTITY_LOCK_KEY);
          current.onsuccess = () => {
            if (current.result?.token === token) store.delete(IDENTITY_LOCK_KEY);
          };
          transaction.oncomplete = () => {
            releaseDb.close();
            resolve();
          };
          transaction.onerror = transaction.onabort = () => {
            releaseDb.close();
            reject(new Error('Private device storage is unavailable.'));
          };
        });
      };
    }
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  throw new Error('Another attendance request is still being secured. Please try again shortly.');
}

async function withIdentityLock(operation) {
  if (navigator.locks?.request) return navigator.locks.request('xcelias-qr-device-link', operation);
  const release = await acquireIdentityLock();
  try {
    return await operation();
  } finally {
    await release();
  }
}

function apiUrl(path) {
  const cloud = globalThis.RED_ACADEMY_CLOUD;
  if (cloud && typeof cloud.apiUrl === 'string') {
    return `${cloud.apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
  return `/api/${path.replace(/^\//, '')}`;
}

async function api(path, body, signal) {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abortFromCaller, {once: true});
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      credentials: globalThis.RED_ACADEMY_CLOUD ? 'omit' : 'same-origin',
      cache: 'no-store',
      headers: {'Content-Type': 'application/json', 'X-Red-Request': '1'},
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error('Attendance request failed.');
      error.status = response.status;
      if (['QR_DEVICE_ALREADY_LINKED', 'QR_DEVICE_REQUEST_PENDING', 'QR_DEVICE_HANDLE_CONFLICT', 'QR_DEVICE_HANDLE_USED', 'QR_DEVICE_NO_SESSION'].includes(result.errorCode)) {
        error.code = result.errorCode;
      }
      throw error;
    }
    return result;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

function setLanguage(next) {
  language = next === 'ar' ? 'ar' : 'en';
  document.documentElement.lang = language === 'ar' ? 'ar-EG' : 'en';
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('is-ar', language === 'ar');
  const text = strings[language];
  page.eyebrow.textContent = language === 'ar' ? 'أكاديمية ريد للتدريب · الحضور' : 'RED TRAINING ACADEMY · ATTENDANCE';
  page.lang.textContent = text.switch;
  page.lang.setAttribute('aria-label', text.languageLabel);
  page.notice.textContent = text.notice;
  page.privacy.textContent = text.privacy;
  page.modeLabel.textContent = text.modeLabel;
  page.mode.options[0].textContent = text.phoneOption;
  page.mode.options[1].textContent = text.codeOption;
  page.activate.textContent = text.activate;
  page.checkin.textContent = text.checkin;
  page.boundHelp.textContent = text.linkedHelp;
  page.pendingTitle.textContent = text.pendingTitle;
  page.pendingCopy.textContent = text.pendingCopy;
  page.replacement.textContent = text.replacement;
  page.footer.textContent = text.footer;
  updateVerificationMode();
  if (batchQrId) render();
}

function updateVerificationMode() {
  const text = strings[language];
  const usePhone = page.mode.value !== 'activationCode';
  page.valueLabel.textContent = usePhone ? text.phoneLabel : text.codeLabel;
  page.valueHelp.textContent = usePhone ? text.phoneHelp : text.codeHelp;
  page.value.type = usePhone ? 'tel' : 'text';
  page.value.inputMode = usePhone ? 'tel' : 'text';
  page.value.autocomplete = usePhone ? 'tel' : 'one-time-code';
  page.value.autocapitalize = usePhone ? 'off' : 'characters';
  page.value.maxLength = usePhone ? 32 : 64;
  page.value.spellcheck = false;
}

function setBusy(value) {
  isBusy = value;
  page.activate.disabled = value;
  page.mode.disabled = value;
  page.value.disabled = value;
  page.checkin.disabled = value || !currentSession || hasCheckedIn || recordedElsewhere || deviceNeedsReplacement || !isApprovedForThisBatch();
  page.loading.hidden = !value;
  page.activate.textContent = value ? strings[language].checking : strings[language].activate;
}

function feedback(message, type = '') {
  page.feedback.textContent = message;
  page.feedback.className = `feedback${type ? ` ${type}` : ''}`;
  page.feedback.hidden = false;
}

function clearFeedback() {
  page.feedback.textContent = '';
  page.feedback.className = 'feedback';
  page.feedback.hidden = true;
}

function isApprovedForThisBatch() {
  return identity?.state === 'approved' && identity.batchQrId === batchQrId && Boolean(identity.credentialId);
}

function localDateLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00Z`));
}

function render() {
  const text = strings[language];
  page.title.textContent = batchName || text.loading;
  page.intro.textContent = currentSession ? text.openIntro : text.waitingIntro;
  page.session.hidden = !currentSession;
  if (currentSession) {
    page.session.textContent = `${text.day} ${currentSession.dayNumber} · ${localDateLabel(currentSession.date)}`;
  }
  page.notice.hidden = false;
  page.notice.textContent = text.notice;
  page.privacy.textContent = text.privacy;
  page.form.hidden = true;
  page.bound.hidden = true;
  page.pending.hidden = true;
  page.recovery.hidden = true;
  page.replacement.hidden = true;

  if (identity?.state === 'legacy-conflict') {
    page.recoveryTitle.textContent = text.conflictTitle;
    page.recoveryCopy.textContent = text.conflictCopy;
    page.recovery.hidden = false;
    return;
  }

  if (identity?.state === 'approved' && identity.batchQrId !== batchQrId) {
    page.recoveryTitle.textContent = text.otherBatchTitle;
    page.recoveryCopy.textContent = text.otherBatchCopy;
    page.recovery.hidden = false;
    return;
  }

  if (identity?.state === 'pending') {
    if (identity.pendingBatchQrId !== batchQrId) {
      page.recoveryTitle.textContent = text.otherBatchTitle;
      page.recoveryCopy.textContent = text.otherBatchCopy;
      page.recovery.hidden = false;
      return;
    }
    page.pendingTitle.textContent = text.pendingTitle;
    page.pendingCopy.textContent = text.pendingCopy;
    page.pending.hidden = false;
    return;
  }

  if (identity?.state === 'requesting' && identity.pendingBatchQrId !== batchQrId) {
    page.recoveryTitle.textContent = text.requestPendingTitle;
    page.recoveryCopy.textContent = text.requestPendingCopy;
    page.recovery.hidden = false;
    return;
  }

  if (identity?.state === 'pending-conflict') {
    page.recoveryTitle.textContent = text.requestPendingTitle;
    page.recoveryCopy.textContent = text.requestPendingCopy;
    page.recovery.hidden = false;
    return;
  }

  if (identity?.state === 'recovery-required') {
    page.recoveryTitle.textContent = text.otherBatchTitle;
    page.recoveryCopy.textContent = text.otherBatchCopy;
    page.recovery.hidden = false;
    return;
  }

  if (isApprovedForThisBatch()) {
    page.name.textContent = identity.traineeName;
    page.bound.hidden = false;
    page.checkin.disabled = !currentSession || hasCheckedIn || recordedElsewhere || deviceNeedsReplacement;
    page.replacement.hidden = !deviceNeedsReplacement;
    return;
  }

  if (currentSession) {
    page.form.hidden = false;
    updateVerificationMode();
  }
}

async function refreshBatchInfo() {
  const knownCredential = isApprovedForThisBatch() ? identity.credentialId : null;
  const info = await api('qr-attendance/public/info', {
    batchQrId,
    ...(knownCredential ? {credentialId: knownCredential} : {}),
  });
  batchName = typeof info.batchName === 'string' ? info.batchName : '';
  currentSession = info.currentSession || null;
  hasCheckedIn = Boolean(info.participant?.checkedIn);
  recordedElsewhere = Boolean(info.participant?.recordedElsewhere);
  deviceNeedsReplacement = Boolean(knownCredential && info.participant?.active === false);
  render();
  if (deviceNeedsReplacement) feedback(strings[language].deviceLost, 'review');
  else if (recordedElsewhere) feedback(language === 'ar' ? 'فيه تسجيل حضور موجود النهارده بالفعل. اسأل المدرب.' : 'An attendance record already exists for today. Ask your trainer.', 'review');
  else if (hasCheckedIn) feedback(strings[language].already, 'success');
  else if (!currentSession && !identity?.requestHandle) feedback(strings[language].waiting, 'review');
}

function sanitizedPublicKey(jwk) {
  if (
    !jwk ||
    jwk.kty !== 'EC' ||
    jwk.crv !== 'P-256' ||
    typeof jwk.x !== 'string' ||
    typeof jwk.y !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(jwk.x) ||
    !/^[A-Za-z0-9_-]{43}$/.test(jwk.y)
  ) {
    throw new Error(strings[language].technical);
  }
  return {kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y};
}

async function createDeviceIdentity() {
  if (!globalThis.crypto?.subtle || !globalThis.isSecureContext) {
    throw new Error(strings[language].technical);
  }
  const generated = await crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']);
  const publicKey = sanitizedPublicKey(await crypto.subtle.exportKey('jwk', generated.publicKey));
  const privateBytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8', generated.privateKey));
  let privateKey;
  try {
    privateKey = await crypto.subtle.importKey('pkcs8', privateBytes, {name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign']);
  } finally {
    privateBytes.fill(0);
  }
  return {id: IDENTITY_KEY, state: 'unlinked', publicKey, privateKey, createdAt: new Date().toISOString()};
}

async function submitLinkRequest(event) {
  event.preventDefault();
  try {
    await withIdentityLock(async () => {
      identity = await readIdentity();
      await submitLinkRequestLocked();
    });
  } catch {
    feedback(strings[language].technical, 'error');
  }
}

async function submitLinkRequestLocked() {
  if (isBusy || !currentSession || page.form.hidden) return;
  const verificationKind = page.mode.value === 'activationCode' ? 'activationCode' : 'phone';
  const value = page.value.value.trim();
  if (!value) {
    page.value.focus({preventScroll: true});
    return;
  }

  setBusy(true);
  clearFeedback();
  stopStatusPolling();
  try {
    identity = identity?.privateKey && identity?.publicKey ? identity : await storeIdentityIfMissing(await createDeviceIdentity());
    if (identity.state === 'legacy-conflict' || identity.state === 'approved' || identity.state === 'pending' || identity.state === 'pending-conflict') {
      render();
      if (identity.state === 'pending' && identity.pendingBatchQrId === batchQrId) startStatusPolling();
      return;
    }
    if (identity.state === 'requesting' && identity.pendingBatchQrId !== batchQrId) {
      render();
      return;
    }

    // Persist both the device key and idempotency handle before sending the request.
    const canResume = identity.state === 'requesting' && identity.pendingBatchQrId === batchQrId && /^[A-Za-z0-9_-]{43}$/.test(identity.requestHandle || '');
    const requestHandle = canResume ? identity.requestHandle : encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    identity = {...identity, state: 'requesting', pendingBatchQrId: batchQrId, requestHandle};
    delete identity.batchQrId;
    await saveIdentity(identity);
    const requestBody = {
      batchQrId,
      requestHandle,
      publicKey: sanitizedPublicKey(identity.publicKey),
      [verificationKind]: value,
    };
    const result = await api('qr-attendance/public/device-link-requests', requestBody);
    if (result.status !== 'pending' || result.requestHandle !== requestHandle || !/^[A-Za-z0-9_-]{43}$/.test(result.requestHandle)) {
      throw new Error('Attendance request failed.');
    }
    identity = {
      ...identity,
      state: 'pending',
      pendingBatchQrId: batchQrId,
      requestHandle: result.requestHandle,
      requestExpiresAt: typeof result.expiresAt === 'string' ? result.expiresAt : null,
    };
    await saveIdentity(identity);
    page.value.value = '';
    render();
    startStatusPolling();
  } catch (error) {
    if (identity?.privateKey) {
      if (error.code === 'QR_DEVICE_ALREADY_LINKED') {
        identity = {...identity, state: 'recovery-required'};
        delete identity.batchQrId;
        delete identity.pendingBatchQrId;
        delete identity.requestHandle;
      } else if (error.code === 'QR_DEVICE_REQUEST_PENDING') {
        identity = {...identity, state: 'pending-conflict'};
      } else if (error.code === 'QR_DEVICE_HANDLE_CONFLICT') {
        identity = {...identity, state: 'pending', pendingBatchQrId: batchQrId};
      } else if (error.code === 'QR_DEVICE_HANDLE_USED') {
        identity = {...identity, state: 'unlinked'};
        delete identity.batchQrId;
        delete identity.pendingBatchQrId;
        delete identity.requestHandle;
      } else {
        identity = {...identity, state: 'requesting', pendingBatchQrId: batchQrId};
      }
      await saveIdentity(identity).catch(() => {});
    }
    render();
    if (error.code === 'QR_DEVICE_ALREADY_LINKED') {
      page.recoveryTitle.textContent = strings[language].otherBatchTitle;
      page.recoveryCopy.textContent = strings[language].otherBatchCopy;
      page.recovery.hidden = false;
    } else if (error.code === 'QR_DEVICE_REQUEST_PENDING') {
      page.recoveryTitle.textContent = strings[language].requestPendingTitle;
      page.recoveryCopy.textContent = strings[language].requestPendingCopy;
      page.recovery.hidden = false;
    } else if (error.code === 'QR_DEVICE_HANDLE_CONFLICT') {
      page.pendingTitle.textContent = strings[language].requestPendingTitle;
      page.pendingCopy.textContent = strings[language].requestPendingCopy;
      page.pending.hidden = false;
      startStatusPolling();
    } else if (error.code === 'QR_DEVICE_NO_SESSION') {
      await refreshBatchInfo().catch(() => {});
      feedback(strings[language].waiting, 'review');
    } else {
      const message = error.code === 'QR_DEVICE_HANDLE_USED' ? strings[language].freshRequest : error.status === 429 ? strings[language].rateLimited : error.status === 400 || error.status === 401 ? strings[language].codeInvalid : strings[language].requestRetry;
      feedback(message, 'error');
    }
  } finally {
    setBusy(false);
  }
}

function stopStatusPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (pollController) {
    pollController.abort();
    pollController = null;
  }
}

async function signStatusPoll(record) {
  const message = `xcelias-qr-link-status:v1\n${record.pendingBatchQrId}\n${record.requestHandle}`;
  const signature = await crypto.subtle.sign(
    {name: 'ECDSA', hash: 'SHA-256'},
    record.privateKey,
    new TextEncoder().encode(message),
  );
  return encodeBase64Url(signature);
}

async function pollStatus() {
  if (pollInFlight || document.hidden || identity?.state !== 'pending' || identity.pendingBatchQrId !== batchQrId) return;
  pollInFlight = true;
  const record = identity;
  pollController = new AbortController();
  try {
    const signature = await signStatusPoll(record);
    const result = await api(
      'qr-attendance/public/device-link-status',
      {batchQrId, requestHandle: record.requestHandle, signature},
      pollController.signal,
    );
    const latestIdentity = await readIdentity();
    if (latestIdentity?.state !== 'pending' || latestIdentity.pendingBatchQrId !== record.pendingBatchQrId || latestIdentity.requestHandle !== record.requestHandle) {
      identity = latestIdentity;
      stopStatusPolling();
      render();
      return;
    }
    identity = latestIdentity;
    if (result.status === 'pending') return;
    stopStatusPolling();

    if (result.status === 'approved') {
      if (
        typeof result.credentialId !== 'string' ||
        !result.credentialId ||
        result.credentialId.length > 128 ||
        typeof result.traineeName !== 'string' ||
        !result.traineeName.trim() ||
        result.traineeName.length > 200
      ) {
        feedback(strings[language].technical, 'error');
        return;
      }
      const nextIdentity = {
        ...record,
        state: 'approved',
        batchQrId,
        credentialId: result.credentialId,
        traineeName: result.traineeName.trim(),
      };
      delete nextIdentity.pendingBatchQrId;
      delete nextIdentity.requestHandle;
      delete nextIdentity.requestExpiresAt;
      identity = await saveIdentityForPendingRequest(record, nextIdentity);
      if (!identity) {
        identity = await readIdentity();
        render();
        return;
      }
      await refreshBatchInfo();
      return;
    }

    if (result.status === 'rejected' || result.status === 'expired') {
      const nextIdentity = {...record, state: result.status};
      delete nextIdentity.batchQrId;
      delete nextIdentity.pendingBatchQrId;
      delete nextIdentity.requestHandle;
      delete nextIdentity.requestExpiresAt;
      identity = await saveIdentityForPendingRequest(record, nextIdentity);
      if (!identity) {
        identity = await readIdentity();
        render();
        return;
      }
      await refreshBatchInfo();
      feedback(result.status === 'rejected' ? strings[language].rejectedCopy : strings[language].expiredCopy, 'review');
    }
  } catch (error) {
    if (error.name !== 'AbortError') feedback(strings[language].requestFailed, 'error');
  } finally {
    pollController = null;
    pollInFlight = false;
  }
}

function startStatusPolling() {
  if (document.hidden || identity?.state !== 'pending' || identity.pendingBatchQrId !== batchQrId || pollTimer !== null) return;
  void pollStatus();
  pollTimer = setInterval(() => void pollStatus(), STATUS_POLL_MS);
}

async function locate() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({status: 'unavailable'});
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({status: 'ok', latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy}),
      (error) => resolve({status: error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable'}),
      {enableHighAccuracy: true, maximumAge: 0, timeout: 12000},
    );
  });
}

async function checkIn() {
  if (isBusy || !isApprovedForThisBatch() || !currentSession || hasCheckedIn || recordedElsewhere || deviceNeedsReplacement) return;
  setBusy(true);
  clearFeedback();
  try {
    const challengeResult = await api('qr-attendance/public/challenge', {batchQrId, credentialId: identity.credentialId});
    const signatureBytes = await crypto.subtle.sign(
      {name: 'ECDSA', hash: 'SHA-256'},
      identity.privateKey,
      new TextEncoder().encode(challengeResult.challenge),
    );
    const signature = encodeBase64Url(signatureBytes);
    const location = await locate();
    const result = await api('qr-attendance/public/check-in', {
      batchQrId,
      credentialId: identity.credentialId,
      challengeId: challengeResult.challengeId,
      challenge: challengeResult.challenge,
      signature,
      location,
    });
    if (result.reviewRequired) {
      const text = strings[language];
      const message = result.reason === 'permission_denied' ? text.denied : result.reason === 'location_unavailable' ? text.unavailable : result.reason === 'location_timeout' ? text.timeout : text.review;
      feedback(message, 'review');
      return;
    }
    hasCheckedIn = true;
    page.checkin.disabled = true;
    feedback(result.alreadyCheckedIn ? strings[language].already : strings[language].success, 'success');
  } catch (error) {
    feedback(error.status === 401 ? strings[language].deviceLost : strings[language].technical, 'error');
  } finally {
    setBusy(false);
  }
}

async function requestReplacement() {
  if (!deviceNeedsReplacement || !isApprovedForThisBatch()) return;
  identity = {
    id: IDENTITY_KEY,
    state: 'unlinked',
    batchQrId: null,
    publicKey: identity.publicKey,
    privateKey: identity.privateKey,
    createdAt: identity.createdAt,
  };
  deviceNeedsReplacement = false;
  await saveIdentity(identity);
  render();
  feedback(strings[language].replacementPrompt, 'review');
  page.value.focus({preventScroll: true});
}

async function refresh() {
  clearFeedback();
  page.title.textContent = strings[language].loading;
  try {
    identity = await readIdentity();
    await refreshBatchInfo();
    if (identity?.state === 'pending' && identity.pendingBatchQrId === batchQrId) {
      startStatusPolling();
    } else if (!identity && currentSession) {
      page.value.focus({preventScroll: true});
    }
  } catch (error) {
    stopStatusPolling();
    page.title.textContent = error.status === 404 ? strings[language].invalid : error.status === 409 || error.status === 410 ? strings[language].inactive : strings[language].technical;
    page.intro.textContent = '';
    page.notice.hidden = true;
    page.privacy.hidden = true;
    page.form.hidden = true;
    page.bound.hidden = true;
    feedback(error.status === 404 ? strings[language].invalid : strings[language].technical, 'error');
  }
}

function batchIdFromHash() {
  const match = location.hash.match(/^#\/batch\/([A-Za-z0-9_-]{16,128})$/);
  return match ? match[1] : '';
}

function clearBatchHash() {
  history.replaceState(null, '', location.pathname + location.search);
}

function navigateToBatch(nextBatchQrId) {
  stopStatusPolling();
  batchQrId = nextBatchQrId;
  batchName = '';
  currentSession = null;
  identity = null;
  hasCheckedIn = false;
  deviceNeedsReplacement = false;
  recordedElsewhere = false;
  page.name.textContent = '';
  page.value.value = '';
  page.title.textContent = strings[language].loading;
  page.form.hidden = true;
  page.bound.hidden = true;
  page.pending.hidden = true;
  page.recovery.hidden = true;
  clearBatchHash();
  void refresh();
}

page.form.addEventListener('submit', submitLinkRequest);
page.mode.addEventListener('change', updateVerificationMode);
page.checkin.addEventListener('click', checkIn);
page.replacement.addEventListener('click', () => void requestReplacement().catch(() => feedback(strings[language].technical, 'error')));
page.lang.addEventListener('click', () => {
  setLanguage(language === 'en' ? 'ar' : 'en');
  try {
    localStorage.setItem('red-academy-qr-language', language);
  } catch {
    // Language choice is optional; attendance does not depend on localStorage.
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopStatusPolling();
  else startStatusPolling();
});
window.addEventListener('pagehide', stopStatusPolling);
window.addEventListener('pageshow', () => startStatusPolling());
window.addEventListener('online', () => void refresh());
window.addEventListener('hashchange', () => {
  const nextBatchQrId = batchIdFromHash();
  if (nextBatchQrId && nextBatchQrId !== batchQrId) {
    navigateToBatch(nextBatchQrId);
  } else if (!nextBatchQrId) {
    stopStatusPolling();
    page.title.textContent = strings[language].invalid;
    page.intro.textContent = '';
    page.form.hidden = true;
    page.bound.hidden = true;
    page.pending.hidden = true;
    page.recovery.hidden = true;
    feedback(strings[language].invalid, 'error');
  }
});

batchQrId = batchIdFromHash();
if (batchQrId) clearBatchHash();
try {
  language = localStorage.getItem('red-academy-qr-language') === 'ar' ? 'ar' : 'en';
} catch {
  language = 'en';
}
setLanguage(language);

if (!batchQrId) {
  page.title.textContent = strings[language].invalid;
  page.intro.textContent = '';
  page.notice.hidden = true;
  page.privacy.hidden = true;
  feedback(strings[language].invalid, 'error');
} else {
  await refresh();
  setInterval(() => {
    if (!document.hidden && !isBusy) void refresh();
  }, 45000);
}
