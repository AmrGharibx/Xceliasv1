# QR Attendance Design

**Status:** Revised proposed design for user review. No product code, database, or live records have been changed.

## Goal

Let a trainer open attendance for each scheduled batch day while reusing one permanent printed QR per batch. The QR contains only a stable, revocable batch join reference—not a day number, date, or daily session token. The server resolves it to the currently open scheduled session. On first enrollment, the trainee enters a private, single-use activation code issued for their roster identity; that browser is then associated with that trainee, so future check-ins show only the trainee's own **I'm here** action. On each check-in, the page requests one foreground position under the browser's permission rules and the server compares it with a staff-configured academy/venue geofence. The default Academy venue is the Red Training Academy pin supplied by the user; the trainee's first scan never establishes or changes the trusted location. A confident in-area result records ordinary Present attendance with server-received arrival time. An outside or uncertain result does not create attendance automatically and instead creates a staff-review alert.

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

The recommended approach prevents casual name-switching. It cannot prove physical presence: browser location is approximate and may be inaccurate or simulated, and a trainee can lend an enrolled phone. The geofence is a deterrent and review signal, not definitive fraud evidence. Trainer visibility and exception handling remain part of the control.

## Trainer workflow

1. The batch detail page shows one tile for each actual scheduled date, labeled Day 1, Day 2, and so on. Each tile shows attendance and location-review counts.
2. An authorized trainer selects **Open QR check-in** on the session date. A session is accepted only for a scheduled date that is today in Cairo time, an active, non-archived batch, and an open check-in window. Future and past dates remain visible but cannot accept QR check-ins; staff can correct history through the existing attendance editor.
3. The trainer prints or displays the batch's stable QR. Opening/closing a daily session is a server-side action and does not change the QR. The staff view shows the current date/day, live check-in count, location-review alerts, and **Close check-in**. Closing the session prevents further check-ins. Authorized staff can rotate a compromised batch QR, which requires printing the replacement.
4. The public page resolves the batch QR to the currently open session. It shows the batch name, current day/date, location notice, the trainee's own check-in state, and operational feedback. It reveals no grades, contact details, notes, assessments, reports, or staff workspace state. Roster details are not returned before a valid activation code or enrolled browser identity establishes the trainee.
5. The trainer closes the window when appropriate. Not scanning or failing location verification does not automatically mark a trainee absent; staff use the existing roll call/manual attendance process.

The printed pass contains the batch number, Academy logo, X Gh signature, scan instructions, and the location notice; it contains no day number/date. The day/date are supplied by the server on the trainee page for the active session.

If the configured participant domain is enabled later, the QR link may use it. No trainee-facing domain or production-origin change is part of this feature.

## Trainee workflow and identity

### First check-in on a browser

1. Scan the batch's permanent QR while a trainer-opened session is active.
2. Enter the trainee's private activation code, which is issued for one roster identity and handed over in person by authorized staff. The backend resolves the identity from the code; the public page does not expose a roster picker/list.
3. The backend verifies that the code belongs to an Active trainee enrolled in the batch and that the scheduled session is still open. It atomically consumes the code and binds a browser-generated public key to the trainee's internal record ID.
4. Before check-in, the trainee sees a location-use notice and explicitly allows the browser to obtain a one-time position. The page confirms the identity and requests location for the **I'm here** action. An in-area result records attendance; an outside/uncertain result records a review event, not attendance. A mismatch, used/revoked code, wrong batch, or closed session fails safely.

### Later check-ins

The browser loads its enrolled key and proves possession by signing a fresh server challenge for the open session. The backend resolves the trainee from the stored public-key binding; the client cannot submit a replacement trainee ID. The challenge endpoint returns a random nonce and the database stores only its SHA-256 hash. The browser echoes the nonce with its signature at check-in; the server hash-compares it to the stored challenge before signature verification, so plaintext challenges are never persisted. A successful proof consumes the challenge. The page identifies the locked trainee and offers only **I'm here**. For every check-in, the browser obtains a one-shot position under user-granted permission and the server evaluates it against the configured venue; the trainee's first reported position is not trusted as the venue anchor. The page never offers a name switch and never tracks location in the background.

### Location verification and review

- The trusted default Academy map point is the Red Training Academy place pin from the user's Google Maps link (`30.0076922, 31.5332323`). Store it as a private, staff-managed venue setting; do not expose the coordinates in the QR, participant API, or trainee page. Start with a 200 m geofence radius, adjustable by authorized staff. A batch/session may use another staff-configured venue when training is held elsewhere. The venue and radius are snapshotted when the session opens. At every check-in, the device supplies a one-time foreground location and the server compares it to this fixed venue point. The trainee's first scan or first reported GPS position never establishes or changes the trusted venue center; it may only provide a coarse diagnostic review signal.
- Request location only when the trainee initiates a check-in, over HTTPS, after a clear notice. The browser accuracy radius is incorporated into the server-side decision: confidently inside may check in automatically; confidently outside or too uncertain is marked **Location needs review**. Denied/unavailable location also goes to the trainer-assisted fallback rather than silently passing or marking the trainee absent.
- The exact trainee-facing notice is: **“Your location is checked during check-in to confirm you're near the Academy. Check-ins attempted from outside the Academy area are logged and flagged for staff review as possible misuse. If you're on-site but your location seems wrong, contact reception—location readings can be inaccurate.”** Provide the same meaning in the selected English/Egyptian Arabic UI language.
- An out-of-area or unverifiable attempt creates a private staff-review item linked to the known trainee, batch, active session, and timestamp. The authorized trainer/attendance staff view shows the reason, status, and coarse accuracy/distance category so reception can follow up. Staff can resolve it and, if appropriate, use the existing manual attendance flow. Do not automatically label a trainee as committing fraud, automatically mark absence, or send an external accusation.
- Do not persist raw latitude/longitude. Retain only the minimum review metadata (reason/status, timestamp, and coarse accuracy/distance bands), restrict it to authorized staff, apply a bounded retention policy, and never return it through the participant API. Browser Geolocation requires permission and a secure context and does not guarantee the device's actual position; its reported accuracy is a 95% confidence radius ([W3C Geolocation API](https://www.w3.org/TR/geolocation/)). Android also supports test/mock locations ([Android Location API](https://developer.android.com/reference/android/location/Location#isMock())), so treat browser coordinates as a deterrent/review signal, not proof of physical presence or a confirmed fraud finding.

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

- Per-batch QR references: batch, stable revocable public reference, creator/rotation timestamps, and active/revoked state. The reference is not an attendance session token or proof of identity.
- Open/closed check-in sessions: batch, scheduled date, selected venue/radius snapshot, creator, open/close/expiry timestamps, version.
- Activation code issuance/consumption state: trainee, code hash, issuer, expiry/used/revoked timestamps.
- Browser enrollment: trainee, public key, created/last-used/revoked timestamps.
- Location-review events: trainee (only after identity is established), batch/session, server timestamp, reason/status, coarse accuracy/distance bands, and staff resolution metadata; never raw coordinates.

Exact table names can be selected in the implementation plan, but these invariants are required:

- One stable QR reference per batch (rotatable by authorized staff); one active QR session per batch/date can accept many different trainees. The same printed batch QR resolves only to the currently open, scheduled Cairo-date session and exposes no roster when no valid session is open.
- A trainee has at most one active enrolled browser key at a time; staff reset revokes it before re-enrollment.
- Activation code consumption and enrollment are atomic; concurrent attempts cannot bind the same code twice.
- A browser key maps to one trainee; attendance always derives trainee identity from that server-side mapping.
- Public endpoints resolve a batch QR reference to a valid open session and return only the minimum needed for activation/check-in; they do not expose a roster before identity is established and never trust client-supplied batch/date/trainee identity without server-side validation.
- Rate-limit QR resolution, code attempts, location-review creation, and check-in attempts. Never log activation codes, private keys, signatures, or precise location coordinates.
- Location and review tables are private in SQLite/cloud persistence; Supabase RLS is enabled as defense in depth and no browser-role direct access is granted. Participant APIs return no location coordinates or review history.
- New Supabase tables stay inaccessible to `anon`/`authenticated` Data API roles; enable RLS as defense in depth and use the existing server-side privileged function path for validated access. Do not expose service-role keys or add a public `SECURITY DEFINER` shortcut.
- Add matching SQLite schema/upgrade support and Supabase migration. Migration is additive only: no attendance rewrite, backfill, batch mutation, or deletion of existing records.

The trainee QR screen must be reachable without a staff login, but must be a separate, minimal participant surface. It must not weaken the general authentication guard or make the staff `/state` route public.

## Rollout and verification criteria

1. Unit/API tests cover code replay, rate limiting, invalid/revoked key, inactive or wrong-batch trainee, closed/future/past/unscheduled session, concurrent duplicate scans, location inside/outside/borderline accuracy, denied/unavailable location, review alert visibility/authorization, no-coordinate persistence, and preserving every pre-existing attendance status.
2. SQLite and Supabase behavior must match. Run the existing full test suite, app checks, cloud build, and migration verification.
3. Local browser test uses a disposable test batch and test trainees, never live Batch 42 or existing production rows. Test stable batch QR across two scheduled dates, code issuance, first enrollment, next-day locked identity, lost-storage reset, repeated scan, manual attendance conflict, location warning and review, staff resolution, and checklist/report/export propagation.
4. Test mobile browsers on HTTPS before production rollout; local loopback is not a substitute for camera scanning another device. Exercise concurrent scans for a 40-trainee cohort and confirm exactly one row per person/date.
5. Deploy the additive migration and matching cloud function as a coordinated release only after the written implementation plan is approved. Then use a new, clearly labeled pilot batch or other user-approved live test scope; do not test by altering a historical batch.

## Out of scope

- Full trainee login accounts, passwords, email/SMS OTP, payroll/biometric identity checks, background/continuous location tracking, camera capture, or device fingerprinting.
- Auto-marking absences, recording departure from a single arrival scan, changing the late threshold, or changing historical attendance/report logic.
- Enabling `join.xcelias.com`, editing user batches, or altering any existing production attendance data.
