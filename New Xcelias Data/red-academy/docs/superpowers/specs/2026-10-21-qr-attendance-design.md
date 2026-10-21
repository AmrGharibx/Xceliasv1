# QR Attendance Design

**Status:** Proposed design for user review. No product code, database, or live records have been changed.

## Goal

Let a trainer open one QR check-in for each scheduled batch day. Trainees scan the same day-specific QR; the first time, each trainee verifies their roster identity with a private one-time activation code. That browser is then associated with that trainee, so future scans show only the trainee's own **I'm here** action. A successful scan writes an ordinary Present record to Daily Attendance, including the server-received arrival time.

The feature must work in both the local SQLite installation and the production Supabase-backed installation, without changing existing attendance history or exposing the staff workspace to trainees.

## Existing application boundaries

- Trainee records already have an internal record ID. That ID is a database identifier, **not a password or proof of identity**. The public client must never be allowed to select a different trainee after its browser identity is enrolled.
- The batch detail view already renders every scheduled session date and links each to Daily Attendance.
- Daily Attendance already drives the session checklist, reports, and exports. QR check-in should create that same record rather than a parallel attendance type.
- The QR encoder exists, and public activity routes already demonstrate a separate trainee-facing API flow. The staff workspace's general state endpoint is protected and must remain protected.
- Local attendance is stored in SQLite; production uses the Academy Supabase Edge Function. Both paths need the same validation and transaction semantics.
- `join.xcelias.com` is not currently enabled in production configuration. Until it is, QR URLs use the configured Academy origin; this design does not change domain routing.

## Options considered

1. **Roster name picker only:** lowest setup effort, but anyone holding the QR could claim another trainee. Rejected.
2. **Individual trainee login accounts:** stronger identity but creates account, password recovery, and onboarding work for every trainee. Not required for this attendance-only use.
3. **One-time activation code plus browser key (recommended):** each trainee receives a private, single-use code tied to their roster record. The code enrolls the browser once; later check-ins require proof from its enrolled key. This adds a small first-day setup step without creating a conventional login account.

The recommended approach prevents casual name-switching. It cannot prove that a person is physically present if a trainee lends an enrolled phone or someone relays the currently open QR. Trainer visibility and exception handling remain part of the control.

## Trainer workflow

1. The batch detail page shows one tile for each actual scheduled date, labeled Day 1, Day 2, and so on. Each tile shows its attendance count and check-in state.
2. An authorized trainer selects **Open QR check-in** on the session date. A session is accepted only for a scheduled date that is today in Cairo time, an active, non-archived batch, and an open check-in window. Future and past dates remain visible but cannot accept QR check-ins; staff can correct history through the existing attendance editor.
3. The trainer screen displays one session-specific QR for the whole batch, the live check-in count/list, and **Close check-in**. The random QR secret is valid only while the trainer session is open and is stored hashed on the server. It is returned only by the authorized session-open response so the trainer can render the QR; it is never included in the general workspace state. Closing the session invalidates it. No permanent, reusable QR is printed.
4. The QR page displays only the minimum needed: the batch name/date, eligible trainee names, the trainee's own check-in state, and operational feedback. It never loads grades, contact details, notes, assessments, reports, or the staff workspace state.
5. The trainer closes the window when appropriate. Not scanning does not automatically mark a trainee absent; the trainer completes the existing roll call/manual attendance process.

If the configured participant domain is enabled later, the QR link may use it. No trainee-facing domain or production-origin change is part of this feature.

## Trainee workflow and identity

### First check-in on a browser

1. Scan the open day QR.
2. Select the trainee's name from that batch and enter the trainee's private activation code.
3. The backend verifies that the one-time code belongs to the selected trainee, that the trainee is Active and enrolled in the batch, and that the scheduled session is still open. It atomically consumes the code and binds a browser-generated public key to the trainee's internal record ID.
4. The page confirms the name being enrolled and offers **I'm here**. A mismatch, used code, revoked code, wrong batch, or closed session fails without creating attendance.

### Later check-ins

The browser loads its enrolled key and proves possession by signing a fresh server challenge for the open session. The backend resolves the trainee from the stored public-key binding; the client cannot submit a replacement trainee ID. The page identifies the locked trainee and offers only **I'm here**. It never offers a name switch.

### Codes and recovery

- Generate a cryptographically random, single-use activation code separately from the trainee ID. Codes are available for both existing and newly added Active trainees, expire 30 days after issuance, and can be reissued by staff if unused or expired.
- Show a newly generated code only to an authorized trainer at issuance; do not return codes from `/state`, retain plaintext codes, or write them to logs. Store only a one-way hash and issuance/consumption metadata.
- Provide a staff-only issue/reissue/reset workflow. Reissue revokes unused codes and invalidates the previous browser binding before a new code is handed to the verified trainee. Record the staff actor and timestamp, never the secret.
- For rollout, staff can issue codes for existing active trainees and hand each code privately at the first session. Never Started or Stopped Attending trainees cannot enroll unless staff first changes their enrollment status.

Use a non-extractable Web Crypto P-256 signing key persisted in IndexedDB rather than a long-lived bearer secret in `localStorage`. The server stores the public key. This binds an origin/browser installation, not guaranteed physical hardware; clearing site data or changing browser loses the key and requires staff recovery. Web Crypto key generation supports non-extractable private keys in secure contexts; validate target mobile-browser behavior during testing: [MDN `SubtleCrypto.generateKey`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey), [MDN structured-clone support for `CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

## Attendance semantics

- A successful check-in creates `daily_attendance` with the scheduled session date, `Present`, and an ISO UTC arrival timestamp from the server. The UI displays Cairo time. Never trust the phone's clock.
- Use the same unique attendance invariant and atomic write as manual attendance. A trainee may check in once per scheduled date; a retry returns the existing result. Do not overwrite an existing Present, Absent, Tour Day, or Off Day record. Direct the trainee to the trainer if a record already exists.
- Do not infer departure time, manually flag `is_late`, or set assessment-day state. A single scan records arrival only; trainers continue to manage departure, assessment day, tour day, and exceptions through existing controls. Calculated lateness follows the existing application's time policy.
- Set QR provenance in safe `source_meta` (for example, method `qr`) while keeping the record in the native attendance uniqueness path. The resulting record must appear immediately in the attendance register and then flow into checklist, reports, and exports as usual.
- Expired session, invalid/reused activation code, invalid signature, inactive trainee, wrong batch/date, already-recorded attendance, and rate limits receive safe, non-sensitive messages. No scan means unrecorded until staff takes roll.

## Data and API boundaries

Additive, private persistence is expected for:

- Open/closed check-in sessions: batch, scheduled date, opaque code hash, creator, open/close/expiry timestamps, version.
- Activation code issuance/consumption state: trainee, code hash, issuer, expiry/used/revoked timestamps.
- Browser enrollment: trainee, public key, created/last-used/revoked timestamps.

Exact table names can be selected in the implementation plan, but these invariants are required:

- One active QR session per batch/date; one open session can accept many different trainees.
- A trainee has at most one active enrolled browser key at a time; staff reset revokes it before re-enrollment.
- Activation code consumption and enrollment are atomic; concurrent attempts cannot bind the same code twice.
- A browser key maps to one trainee; attendance always derives trainee identity from that server-side mapping.
- Public endpoints only return the minimal roster for a valid open QR session and accept enrollment/check-in actions. They never trust client-supplied batch/date/trainee identity without server-side validation.
- Rate-limit roster reads, code attempts, and check-in attempts. Never log QR tokens, activation codes, private keys, or signatures that can be replayed.
- New Supabase tables stay inaccessible to `anon`/`authenticated` Data API roles; enable RLS as defense in depth and use the existing server-side privileged function path for validated access. Do not expose service-role keys or add a public `SECURITY DEFINER` shortcut.
- Add matching SQLite schema/upgrade support and Supabase migration. Migration is additive only: no attendance rewrite, backfill, batch mutation, or deletion of existing records.

The trainee QR screen must be reachable without a staff login, but must be a separate, minimal participant surface. It must not weaken the general authentication guard or make the staff `/state` route public.

## Rollout and verification criteria

1. Unit/API tests cover code/name mismatch, one-time code replay, rate limiting, invalid/revoked key, inactive or wrong-batch trainee, closed/future/past/unscheduled session, concurrent duplicate scans, and preserving every pre-existing attendance status.
2. SQLite and Supabase behavior must match. Run the existing full test suite, app checks, cloud build, and migration verification.
3. Local browser test uses a disposable test batch and test trainees, never live Batch 42 or existing production rows. Test code issuance, first enrollment, next-day locked identity, lost-storage reset, repeated scan, manual attendance conflict, and checklist/report/export propagation.
4. Test mobile browsers on HTTPS before production rollout; local loopback is not a substitute for camera scanning another device. Exercise concurrent scans for a 40-trainee cohort and confirm exactly one row per person/date.
5. Deploy the additive migration and matching cloud function as a coordinated release only after the written implementation plan is approved. Then use a new, clearly labeled pilot batch or other user-approved live test scope; do not test by altering a historical batch.

## Out of scope

- Full trainee login accounts, passwords, email/SMS OTP, payroll/biometric identity checks, GPS, camera capture, or device fingerprinting.
- Auto-marking absences, recording departure from a single arrival scan, changing the late threshold, or changing historical attendance/report logic.
- Enabling `join.xcelias.com`, editing user batches, or altering any existing production attendance data.
