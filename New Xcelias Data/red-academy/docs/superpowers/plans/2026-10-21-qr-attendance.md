# QR Attendance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let trainers reuse one permanent printed QR per batch while opening a server-controlled attendance session for each scheduled day. Bind each trainee’s browser to their identity with a private one-time code, verify venue proximity at each check-in, and provide a branded, privacy-aware experience.

**Architecture:** Keep successful attendance as ordinary `daily_attendance` records. A stable per-batch QR reference resolves server-side to the currently open scheduled-date session; opening a new day does not require reprinting the pass. Implement matching validation and atomic behavior in SQLite and the Supabase Edge Function, with private batch-QR, venue, activation, session, enrollment, challenge, and location-review records. Use a separate minimal trainee page, Web Crypto browser identity, one-time foreground geolocation checks against a staff-configured venue, the existing 1,400-star effect and Academy assets, and a print-ready branded pass. Production participant URLs resolve to Xcelias, never GitHub Pages.

**Tech Stack:** Node.js 24, vanilla JavaScript modules, SQLite, Supabase Edge Functions/Postgres, Web Crypto P-256, existing `qrcode-generator`, Node test runner, and the project’s browser-test harness.

**Spec:** `docs/superpowers/specs/2026-10-21-qr-attendance-design.md`

## Global Constraints

- The trainee’s internal record ID is not a password or proof of identity.
- A check-in is allowed only for a scheduled Cairo date that is today, an active non-archived batch, and an open QR session. A session expires at the next Cairo midnight or when staff closes it, whichever comes first.
- Activation codes are random, single-use, hashed at rest, expire after 30 days, and are never returned in `/state` or written to logs.
- The check-in trainee identity comes from the server-side browser-key binding, not a client-supplied trainee ID.
- Successful QR attendance is a normal `Present` record with a server UTC arrival time; it must not overwrite any existing attendance status or mark an absence automatically.
- Existing attendance history, assessments, batches, and trainee records are not rewritten, backfilled, or deleted.
- Production QR links use `https://xcelias.com/red-academy/qr-attendance/`; local test links remain local. Never generate a GitHub Pages participant link.
- The printed QR is stable per batch and contains no date, day number, session secret, or trainee identity. Only authorized staff can rotate a compromised batch QR.
- The server resolves the stable batch QR to the currently open scheduled Cairo-date session; no open session means no roster/check-in access. Daily attendance remains date-specific in backend state.
- Location is requested only at a trainee-initiated check-in. Compare with the fixed Red Training Academy Google Maps pin (`30.0076922, 31.5332323`) as the default trusted venue—not a trainee's first reported GPS fix. Keep the venue coordinates private to staff/server configuration. Start with a 200 m radius; allow an authorized trainer to choose a separately configured venue for off-site sessions. Store no raw trainee coordinates; create private, coarse location-review metadata when outside/uncertain/unavailable.
- Outside or uncertain location attempts are flagged for staff review, not automatically called fraud and never auto-converted into an Absent attendance row. No QR attempt by itself changes attendance.
- Public QR endpoints return only the minimum batch/current-session and the bound trainee's own check-in state; never expose the full roster before identity is established, staff `/state`, grades, contact details, notes, raw location, or review history.
- QR persistence is private: Supabase tables have RLS enabled and no browser-role access; only validated server-side handlers use privileged database operations.
- Follow `AGENTS.md`: use safe static API errors, validate/escape user-derived UI content, and keep secrets out of source and logs.

## Review Focus

- Wrong, expired, replayed, or mismatched activation code — test that no other trainee can be enrolled and retries are safe only for the same already-enrolled key.
- A public request attempting to change trainee, batch, or date — test that identity and scope are derived from server records and staff state remains inaccessible.
- Simultaneous scans from a 40-person cohort or repeated requests from one person — test atomic one-row-per-trainee/date behavior and reasonable rate limits.
- Existing `Absent`, `Tour Day`, `Off Day`, or manual `Present` entry — test it is preserved and the trainee is directed to the trainer rather than silently overwritten.
- Non-Cairo midnight, unscheduled/past/future date, closed session, or archived batch — test the check-in is rejected even if the browser clock or request payload claims otherwise.
- A static batch QR scanned on different dates — test it resolves only to the date currently opened by authorized staff and never exposes an inactive session or roster.
- Geofence boundary, poor accuracy, denied/unavailable permission, client-submitted forged coordinates, and location-event visibility — test server-side decisions, no raw-coordinate persistence/logging, no false absence, and staff-only review access.

---

### Task 1: Canonical Xcelias URL and QR rendering foundation

**Files:**
- Create: `public/modules/qr-attendance-url.mjs`
- Modify: `cloud/production.json`
- Modify: `scripts/build-cloud.mjs`
- Modify: `tests/qr-code.test.mjs`
- Create: `tests/qr-attendance-url.test.mjs`
- Modify: `docs/CLOUD_DEPLOYMENT.md`

**Interfaces:**
- Produces browser-safe `qrAttendanceUrl({ currentHref, configuredBase, batchQrId })`, returning the stable per-batch Xcelias participant URL for cloud builds, the local route for localhost/127.0.0.1, and an error for an invalid production base or batch QR reference. The same module is imported by staff UI and Node tests.
- Add public, non-secret `participantAppUrl: "https://xcelias.com/red-academy"` to cloud configuration and emit it as `participantAppUrl` in generated `cloud-config.js`.
- The printed QR uses `/qr-attendance/#/batch/<opaque-batch-qr-id>`. This stable reference identifies a batch but is not an attendance credential; activation codes, browser signatures, active-session checks, venue verification, and rate limits remain mandatory. Do not place a session token, date, or day number in the QR URL.

- [ ] **Step 1: Add failing URL tests** named `qrAttendanceUrlUsesXceliasFromGithubMirror`, `qrAttendanceUrlStaysLocalForLoopback`, `qrAttendanceUrlRejectsUnapprovedProductionBase`, `qrAttendanceUrlIsStablePerBatchAcrossDates`, and `qrBatchQrUrlContainsNoSessionDateOrDay`; assert the exact production origin/path, local origin, stable batch reference, and absence of session secrets/date/day from the URL.
- [ ] **Step 2: Run** `node --test tests/qr-attendance-url.test.mjs`; confirm the new module/config behavior is missing.
- [ ] **Step 3: Implement** the browser-safe URL helper and cloud-config field. Validate production base exactly as HTTPS `xcelias.com` plus `/red-academy`; do not enable `join.xcelias.com` or alter the live app origin. The batch QR reference must remain unchanged when a new session date opens.
- [ ] **Step 4: Update deployment guidance** to state QR participant links are canonical Xcelias links, regardless of which staff mirror opened the workspace.
- [ ] **Step 5: Run** `node --test tests/qr-attendance-url.test.mjs tests/qr-code.test.mjs`; all URL and QR validation tests pass.
- [ ] **Step 6: Commit** as `feat(academy): pin QR attendance links to Xcelias`.

### Task 2: SQLite schema, domain operations, and local API

**Files:**
- Create: `public/modules/qr-attendance-core.mjs`
- Create: `server/qr-attendance.mjs`
- Modify: `server/schema.sql`
- Modify: `server/sqlite.mjs`
- Modify: `server/service.mjs`
- Create: `tests/qr-attendance.test.mjs`

**Interfaces:**
- Add local routes: staff `POST /api/qr-attendance/batch-qr/ensure`, `/batch-qr/rotate`, `/codes`, `/venues/upsert`, `/location-reviews/resolve`, `GET /api/qr-attendance/sessions?batchId=&date=`, `/venues`, `/location-reviews?batchId=&date=`, and `POST /api/qr-attendance/sessions/open`, `/sessions/close`; public `POST /api/qr-attendance/public/info`, `/enroll`, `/challenge`, and `/check-in`.
- `POST /codes` accepts `{ traineeId, action: "issue" | "reissue" }` and returns `{ activationCode, expiresAt }` once. Generate 80 random bits as a 16-character Crockford Base32 code, display as four groups of four, store only SHA-256, and expire in 30 days. Reissue revokes the old code and browser binding.
- `POST /batch-qr/ensure` idempotently creates or returns the batch's stable printable QR reference to authorized staff. `/batch-qr/rotate` revokes the old reference and returns a replacement, requiring a new print. The reference is not a secret or login credential and grants no check-in when no valid current session is open.
- `GET /sessions?batchId=&date=` returns open-session metadata and a review count: `{ session: { id, batchName, dayNumber, date, expiresAt }, checkedIn, total, locationReviewCount, checkins: [{ traineeName, arrivalTime, locationStatus }] }`. It never returns raw location or a QR/session secret.
- `/sessions/open` accepts `{ batchId, date, venueId? }` and opens one session for a scheduled Cairo date, returning `{ id, dayNumber, date, expiresAt }`; omitted `venueId` selects the seeded Red Training Academy default. An explicitly selected venue must be an active staff-configured venue. It never creates a new QR/token. If a session is already open for the batch, staff explicitly closes it before opening another. Expiry is the next Cairo midnight. `/sessions/close` accepts `{ id }` and disables check-in through the same permanent batch QR until another eligible session is opened.
- Session open verifies `batch.status === "Active"`, no `archived_at`, exact membership in `session_dates`, and today’s date from the server’s `Africa/Cairo` clock. Staff POST requests also retain the existing exact-Origin and `X-Red-Request` checks.
- `/public/info` accepts `{ batchQrId }` and returns only `{ batchName, currentSession: { id, dayNumber, date, expiresAt } | null, locationNotice }` with `Cache-Control: no-store`. It returns no roster and no trainee information before identity is verified.
- `/public/enroll` accepts `{ batchQrId, activationCode, publicKey }`; the single-use code resolves the trainee server-side, is checked against active batch membership, then consumed atomically while binding one P-256 public key. Return the trainee name only after successful validation. Repeating the same request/key after a lost response returns the same enrollment; a different key cannot reuse the code.
- `/public/challenge` accepts `{ batchQrId, credentialId }` and returns `{ challengeId, challenge, currentSession }` with a two-minute, one-use lifetime. `/public/check-in` accepts `{ batchQrId, credentialId, challengeId, challenge, signature, location: { status: "ok", latitude, longitude, accuracy } | { status: "denied" | "unavailable" | "timeout" } }`. The browser echoes the nonce so the server can compare its SHA-256 hash with the stored challenge hash before verifying the signature; never persist the plaintext nonce. Validate finite/range-bounded coordinates and calculate distance on the server against the venue snapshot assigned to this session. Derive trainee, batch, date, and venue from server-side bindings; never trust client-supplied IDs, venue, distance, or decision.
- A confidently in-area result creates the normal Present record. Outside, boundary-uncertain, permission-denied, or unavailable location creates a private **Location needs review** item and no attendance row. Return a safe message saying the attempt was flagged for staff review and advising the trainee to contact reception if on-site; do not claim reception was directly notified unless a real notification integration exists. Apply an accuracy-aware boundary rule: automatic acceptance only when the reported uncertainty radius is confidently inside the configured geofence; points whose uncertainty overlaps the boundary require review.
- Authorized staff can read/resolve location-review items. Return only trainee name, batch/day/date, attempt time, reason, coarse accuracy/distance band, and resolution state. Record reviewer and resolution timestamp; use the existing manual attendance flow if an attendance correction is appropriate.
- Configure Academy/alternate training venues through authorized staff settings. Default radius is 200 m and adjustable by authorized staff. The session snapshots the selected venue/radius when it opens so staff cannot silently change the check-in boundary mid-session. The first activation may provide diagnostic data, but never automatically sets trusted venue coordinates. Each check-in is compared with the configured venue. Do not persist or log raw trainee latitude/longitude; persist only reason/status, timestamp, and coarse accuracy/distance bands under a documented retention policy. Browser Geolocation requires permission and a secure context and does not guarantee the device's actual position; its reported accuracy is a 95% confidence radius ([W3C Geolocation API](https://www.w3.org/TR/geolocation/)). Treat client coordinates as untrusted input, not proof.
- SQLite tables: `qr_attendance_batch_links`, `qr_attendance_venues`, `qr_attendance_sessions`, `qr_attendance_activation_codes`, `qr_attendance_enrollments`, `qr_attendance_challenges`, and `qr_attendance_location_reviews`, all excluded from workspace state serialization. Foreign keys cascade only with explicit deletion of their owning batch/trainee/session; they do not change attendance rows.
- `public/modules/qr-attendance-core.mjs` supplies shared Cairo-date/day-number, base64url, validation, and Web Crypto P-256 signing/verification helpers usable in Node and Deno.
- Add repository methods with matching shapes: `qrEnsureBatchLink({ batchId }, user)`, `qrRotateBatchLink({ batchId }, user)`, `qrUpsertVenue(input, user)`, `qrIssueCode({ traineeId, action }, user)`, `qrSessionState({ batchId, date })`, `qrOpenSession({ batchId, date, venueId? }, user)`, `qrCloseSession({ id }, user)`, `qrSessionInfo({ batchQrId })`, `qrEnroll({ batchQrId, activationCode, publicKey })`, `qrChallenge({ batchQrId, credentialId })`, `qrCheckIn({ batchQrId, credentialId, challengeId, challenge, signature, location })`, and `qrResolveLocationReview({ reviewId, outcome }, user)`.

- [ ] **Step 1: Write failing tests** named `qrSessionRequiresActiveBatchAndTodaySchedule`, `stableBatchQrResolvesOnlyCurrentOpenSession`, `rotatingBatchQrRevokesPriorReference`, `qrActivationCodeIsOneTimeAndHashed`, `qrCodeDerivesTraineeFromActivationCode`, `qrEnrollmentRetryAcceptsOnlySamePublicKey`, `qrRevokedKeyAndChallengeReplayAreRejected`, `qrGeofenceInsideCreatesPresent`, `qrGeofenceOutsideCreatesReviewNotAttendance`, `qrGeofenceBoundaryAndPoorAccuracyRequireReview`, `qrPermissionDeniedDoesNotAutoPass`, `qrLocationPayloadIsValidatedAndNeverPersisted`, `locationReviewRequiresAuthorizedStaff`, `qrCheckInUsesCairoDateAndServerTime`, `qrCheckInPreservesExistingStatus`, `qrFortyConcurrentTraineesCreateFortyRows`, and `qrPublicRoutesNeverExposeStaffStateOrRoster`; assert exact route status, privacy fields, identity, row count/status, and safe response fields.
- [ ] **Step 2: Run** `node --test tests/qr-attendance.test.mjs`; confirm failures expose the absent tables/routes.
- [ ] **Step 3: Add SQLite tables and indexes** in `server/schema.sql`; use cascade foreign keys for QR-only rows when their parent batch/trainee/session is explicitly deleted. Retain existing `daily_attendance` schema and native unique-index behavior. Add repository methods in `server/sqlite.mjs` for batch-QR lifecycle, venue configuration, code issue/revoke, session lifecycle, enrollment, challenge consumption, private review-event creation/resolution, rate limits, and attendance insert in `BEGIN IMMEDIATE` transactions.
- [ ] **Step 4: Implement** the shared Web Crypto helpers and server validations. Store hashes only for activation codes and challenge nonces; store the revocable stable batch QR reference as a public identifier, not as a secret; store only public keys for browser identity. Never log or persist raw trainee coordinates.
- [ ] **Step 5: Implement** only the explicit QR-resolution/enrollment/challenge/check-in routes before staff authentication; require the existing staff session plus batch attendance permission for QR rotation, venue settings, session control, code issuance, and review resolution. Keep `/state` behind its current authentication guard. Rate-limit QR resolution, code attempts, challenges, location-review events, and check-ins; never include activation codes, exact coordinates, or personal data in limit keys or logs. Do not return trainee names until a private code or enrolled identity is validated.
- [ ] **Step 6: Write attendance through the normal record path only after a confident in-area decision** with `status: "Present"`, Cairo-session date, server-generated UTC `arrival_time`, null departure, and `source_meta.method: "qr"`. For outside/uncertain/permission errors, create only a private review item; never write attendance or auto-mark absence. Return idempotent success only for the same QR record; preserve every other existing status and return a safe conflict. Emit the existing local change event so authorized staff views and review alerts refresh immediately.
- [ ] **Step 7: Run** `node --test tests/qr-attendance.test.mjs tests/api.test.mjs tests/database.test.mjs`; all pass, including concurrent duplicate requests.
- [ ] **Step 8: Commit** as `feat(academy): add local QR attendance operations`.

### Task 3: Supabase migration and cloud API parity

**Files:**
- Create: `supabase/migrations/20261021093706_qr_attendance.sql`
- Modify: `supabase/functions/academy/index.ts`
- Modify: `tests/cloud-operations.test.mjs`
- Create: `tests/qr-attendance-supabase-migration.test.mjs`
- Create: `tests/qr-attendance-cloud-contract.test.mjs`

**Interfaces:**
- Use the same route and request/response contract as Task 2; public handlers run only after allowed-origin and rate-limit checks and before `requireUser`, while staff routes require the current authenticated session and batch-attendance permission.
- Add private SQL RPCs for batch-QR lifecycle, venue settings, atomic code consumption/enrollment, one-use challenge consumption, session open/close, location-review recording/resolution, and attendance insertion. Revoke execute from `PUBLIC`, `anon`, and `authenticated`; grant only to the existing server-side service role.
- RPCs derive saved trainee/batch/date/venue from validated activation, enrollment, and session rows; callers cannot bypass the Edge Function by calling Data API tables directly. Calculate distance server-side and never persist raw trainee coordinates.

- [ ] **Step 1: Add failing migration tests** named `qrAttendanceTablesArePrivateAndRlsEnabled`, `qrAttendanceRpcsAreServiceRoleOnly`, `qrAttendanceHasStableBatchQrAndOneOpenSession`, `qrAttendanceHasOneActiveEnrollment`, `qrLocationReviewStoresNoCoordinates`, and `qrAttendanceMigrationDoesNotRewriteAttendance`; assert private tables/indexes, execute grants, review retention metadata, and the absence of `UPDATE`/`DELETE`/backfill against existing attendance.
- [ ] **Step 2: Run** `node --test tests/qr-attendance-supabase-migration.test.mjs`; confirm the additive migration is absent.
- [ ] **Step 3: Add the additive migration** with batch-link/venue/session/code/enrollment/challenge/location-review tables, parent foreign keys with QR-row-only cascades, expiry and uniqueness constraints, RLS, and private RPCs. Bump the existing workspace revision when QR attendance or a review event is committed so authorized staff clients refresh. Do not alter or backfill existing batch, trainee, or attendance data.
- [ ] **Step 4: Add cloud Edge Function handlers** matching Task 2. Keep the staff `/state` route protected; map internal database failures to the existing safe static responses.
- [ ] **Step 5: Add cloud contract tests** for public QR-resolution/enroll/challenge/check-in routes, staff QR/venue/session/review routes, the `requireUser` boundary, no-store participant responses, and safe error mapping; add parity tests for wrong/replayed codes, changed trainee identity, inactive/wrong-batch enrollment, session restrictions, inside/outside/uncertain location, denied permission, private alert access, no coordinate persistence, idempotent scans, status preservation, and 40 simultaneous attendees.
- [ ] **Step 6: Run** `node --test tests/qr-attendance-supabase-migration.test.mjs tests/qr-attendance-cloud-contract.test.mjs tests/cloud-operations.test.mjs`; then run `npx supabase db push --dry-run` against the linked project and verify it reports only the new QR migration before any live apply.
- [ ] **Step 7: Commit** as `feat(academy): add private Supabase QR attendance support`.

### Task 4: Branded trainee check-in page and browser binding

**Files:**
- Create: `public/qr-attendance/index.html`
- Create: `public/qr-attendance/qr-attendance.css`
- Create: `public/qr-attendance/qr-attendance.mjs`
- Create: `tests/qr-attendance-browser.py`
- Modify: `tests/qr-code.test.mjs`

**Interfaces:**
- Load the existing `../starfield.mjs` (the existing 1,400-star canvas), `../training-academy-logo.svg`, and the Academy’s X Gh signature treatment. Reuse the existing QR encoder and application typography/colors. Set page referrer policy to `no-referrer` and keep API responses uncached.
- Load the generated `../cloud-config.js` when present; use `RED_ACADEMY_CLOUD.apiUrl` for production and same-origin `/api` for local mode, always with `X-Red-Request: 1`, `cache: "no-store"`, and same-origin credentials.
- Read the stable per-batch reference from the URL fragment and use the four public endpoints from Task 2. Generate an ECDSA P-256 key pair with a non-extractable private key; export only the public key. Persist the credential ID and private `CryptoKey` in IndexedDB before submitting enrollment.
- First visit shows the location-use notice and a masked private-code field; the API derives the trainee identity from the one-time code and returns the name only after validation. Do not load a public roster. Enrolled visits show the bound trainee’s name and a single **I’m here** action; there is no client-side trainee switch control.
- At every **I’m here** action, request one foreground location fix after the notice is visible, then send latitude/longitude/accuracy only over HTTPS for server-side evaluation. Never persist or log raw trainee coordinates. If outside, uncertain, denied, or unavailable, do not create attendance; show that the attempt was flagged for staff review and direct the trainee to reception if they are on-site.
- Trainee notice (English): **“Your location is checked during check-in to confirm you're near the Academy. Check-ins attempted from outside the Academy area are logged and flagged for staff review as possible misuse. If you're on-site but your location seems wrong, contact reception—location readings can be inaccurate.”** Add a natural Egyptian Arabic equivalent and show the version matching the trainee's selected language.

- [ ] **Step 1: Write failing browser tests** named `firstQrVisitRequiresPrivateCodeWithoutRoster`, `locationNoticePrecedesPermissionPrompt`, `enrolledBrowserCannotSwitchTrainee`, `qrCheckInShowsServerTimeAndOnlyOneAction`, `outsideLocationShowsStaffReviewMessage`, `locationDeniedOffersReceptionFallback`, `lostIndexedDbShowsTrainerRecovery`, and `publicQrPageNeverLoadsWorkspaceStateOrRawLocation`; assert visible controls, bound credential, response fields, and absence of grades/contact/roster/raw coordinates.
- [ ] **Step 2: Run** `python tests/qr-attendance-browser.py`; confirm the new page and flows are absent.
- [ ] **Step 3: Build** the responsive, accessible trainee page with RED Academy logo, animated X Gh in the app, flying stars, reduced-motion support, keyboard-accessible controls, and live status announcements. Keep the activation code masked by default and never render it after enrollment. Show the location notice before invoking Geolocation.
- [ ] **Step 4: Implement** IndexedDB key persistence, code enrollment, challenge signing, identity locking, one-shot location acquisition, and the one-button repeat check-in flow. Handle unavailable Web Crypto/IndexedDB/location and cleared browser storage with clear reception-assisted recovery messages. After reading the batch QR reference from the fragment, remove it from the visible/history URL and retain it in memory only.
- [ ] **Step 5: Run** `python tests/qr-attendance-browser.py`; verify visual state, mobile viewport, keyboard path, reduced motion, and locked trainee identity.
- [ ] **Step 6: Commit** as `feat(academy): add branded trainee QR check-in page`.

### Task 5: Trainer controls, code handoff, location review, and permanent batch pass

**Files:**
- Modify: `public/modules/views.mjs`
- Modify: `public/modules/forms.mjs`
- Modify: `public/app.mjs`
- Create: `public/modules/qr-attendance-trainer.mjs`
- Create: `public/qr-attendance/print.css`
- Modify: staff authorization only if needed to grant the designated receptionist narrow batch-attendance/location-review access
- Modify: `tests/browser_dom.py`
- Modify: `tests/qr-attendance-browser.py`

**Interfaces:**
- Add **Open QR check-in** on each scheduled-date tile in active, non-archived batch detail. Past/future dates and read-only users cannot start a session. Generate one stable QR per batch; opening a date-specific session does not create another QR.
- Seed the default Academy venue from the supplied Red Training Academy map pin (`30.0076922, 31.5332323`) in private server-side venue settings. Default radius is 200 m and adjustable by authorized staff. Venue coordinates are private and staff-managed; a trainee's first reported position is never automatically trusted as the venue center. Check every attendance attempt against the configured venue snapshot for that session.
- Trainer session view shows batch/day/date, live attendance count/list, and a **Location needs review** queue with trainee, attempt time, reason, coarse accuracy/distance band, and review status. Authorized attendance staff can resolve an alert and use the existing manual attendance flow when appropriate. Poll every five seconds while visible; stop polling on close/navigation. Do not label unverified events as confirmed fraud.
- Make the review queue available only to accounts with batch attendance permission. If the designated receptionist role lacks it, add the narrowest explicit permission; do not broaden unrelated admin access. The alert is in-app (no SMS/email/push promise unless a separate notification service is added later).
- Add a staff-only **Issue / reissue trainee code** action in the trainee profile. Display a newly issued code once with explicit private handoff guidance; do not persist plaintext in the client workspace state or audit log.
- Provide **Print batch QR pass** using browser print/PDF. Print an A4 portrait card with a high-contrast stable batch QR, centered Academy logo above the QR modules (not overlaid on the encoded cells), batch number, scan instruction, static X Gh signature, and location-use notice. Do not print a day number or date; the trainee page displays those from the active server session. The digital view retains the animated signature and starfield; print CSS removes animation, canvas, controls, and dark backgrounds.
- Use the English location notice in Task 4 and a natural Egyptian Arabic equivalent. Outside/uncertain message: **“We couldn't verify that you're near the Academy, so attendance wasn't recorded automatically. Your attempt was logged for staff review as possible misuse. If you're on-site, please contact reception.”** Permission-denied/unavailable messages explain the reception-assisted fallback. Do not claim a receptionist was directly notified unless an actual notification integration exists; do not call an unverified event confirmed fraud.

- [ ] **Step 1: Add failing browser tests** named `batchSessionTilesOnlyOpenTodayForWritableActiveBatch`, `batchQrPersistsAcrossScheduledDates`, `batchQrRotationRequiresConfirmation`, `trainerQrShowsAttendanceAndLocationReview`, `locationReviewRequiresAuthorizedStaff`, `activationCodeIsShownOnceAndClearedOnModalClose`, and `printPassContainsBrandAndBatchButNoDayOrDate`; assert past/future/archived/read-only cases remain disabled, the QR stays stable across dates, rotation invalidates the previous reference only after confirmation, and the pass has QR, logo, X Gh signature, batch number, location notice, and no private codes/names.
- [ ] **Step 2: Run** `python tests/browser_dom.py`; confirm the expected batch-detail and profile controls are missing.
- [ ] **Step 3: Implement** batch-detail controls and the trainer session modal/controller. Call `store.api` for staff endpoints; escape all trainee/batch names and bind refresh/close handlers to the modal lifecycle.
- [ ] **Step 4: Implement** the profile code issuance/reissue interaction. Keep the response in transient component state only; clear it when the modal closes.
- [ ] **Step 5: Render** the stable per-batch QR from the canonical Xcelias URL and opaque batch reference. Use the existing encoder’s quiet zone and high contrast. Keep the Academy logo centered in the pass layout but outside the QR matrix to avoid reducing scan reliability. Verify the QR payload is unchanged across scheduled dates.
- [ ] **Step 6: Add** print stylesheet and browser print action. Hide private activation codes, live trainee names, staff controls, starfield canvas, and workspace navigation from the printed pass; include only the stable batch QR, batch number, Academy mark, X Gh signature, and location notice—never a day number/date.
- [ ] **Step 7: Run** `python tests/browser_dom.py` and `python tests/qr-attendance-browser.py` separately; verify all required print fields and controls, and that no printed/QR URL contains `github.io`.
- [ ] **Step 8: Commit** as `feat(academy): add trainer QR controls and printable pass`.

### Task 6: End-to-end verification and coordinated rollout

**Files:**
- Modify: `tests/qr-attendance.test.mjs`
- Modify: `tests/qr-attendance-browser.py`
- Modify: `docs/CLOUD_DEPLOYMENT.md`

- [ ] **Step 1: Run full local suite** with `npm test` and `npm run check`; fix any regressions before deployment.
- [ ] **Step 2: Inspect `cloud-dist` before building** because the existing cloud builder clears that output directory. If it contains anything other than generated build output, preserve it and add/use a fresh temporary build output path. Run `npm run cloud:build` and inspect the generated QR page/config. Confirm the link host is exactly `xcelias.com`, the target path is `/red-academy/qr-attendance/`, and no generated URL uses a GitHub hostname.
- [ ] **Step 3: Use a disposable SQLite database** and clearly labelled synthetic batch/trainees to test activation, day-one binding, next-day locked identity, reissue/reset, manual-attendance conflict, 40 parallel check-ins, and checklist/report/export propagation. Never use Batch 42, Batch 43, or other existing production records as test fixtures.
- [ ] **Step 4: Run browser checks** at desktop and mobile viewport sizes; inspect print preview and verify the QR payload with the local encoder/test decoder. Test geofence inside/outside/boundary/poor-accuracy/permission-denied cases with controlled browser-location test overrides. A physical phone scan against production requires a clearly labelled disposable pilot batch and trainee; do not create or use one without a separate user-approved test scope. Verify reduced-motion behavior, stable QR reuse across multiple dates, and that closing a session blocks check-ins without invalidating the printed batch QR.
- [ ] **Step 5: Re-run** `npx supabase db push --dry-run`; require output limited to `20261021093706_qr_attendance.sql`, then apply the additive migration and deploy the `academy` Edge Function only after the dry run is clean. Do not create or modify a live batch or live trainee to test this release.
- [ ] **Step 6: Build and verify the final cloud app**, commit all implementation changes, push to `origin main` as requested, and wait for the production deployment to report ready. Verify `https://xcelias.com/red-academy/qr-attendance/` loads without a GitHub redirect and staff QR links use that same Xcelias host.
- [ ] **Step 7: Start the local Academy server** on a separate disposable database/port for the user to inspect. Report test/build/deployment evidence and clearly distinguish local synthetic checks from the live migration/deploy; do not claim a physical-phone scan or production attendance write unless actually performed.
