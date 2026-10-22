# QR Attendance Device Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require trainer approval before a browser/device can be linked to a trainee, then restrict that identity to one trainee and one attendance record per open session.

**Architecture:** Keep the existing stable batch QR, signed browser key, attendance session, and geofence flow. Add a pending device-link request layer in local SQLite and Supabase; staff approval atomically creates or replaces an enrollment, while the trainee page polls using an opaque request handle. Preserve existing active enrollments and records; local and cloud behavior must remain contract-equivalent.

**Tech Stack:** Node.js ESM, Express-style RED Academy service routes, SQLite, Supabase Postgres/RPC + Deno Edge Function, vanilla JavaScript, Web Crypto/IndexedDB, Node built-in test runner, Python browser harness.

**Spec:** `docs/superpowers/specs/2026-10-22-qr-device-binding-design.md`

## Global Constraints

- A new browser profile or cleared browser storage is unrecognized and requires trainer approval; do not claim reliable physical-handset identification.
- A request is valid for at most 30 minutes and never beyond the open session.
- Existing active enrollments are grandfathered; code issuance or an unapproved request never revokes them.
- No raw phone number, private recovery code, exact trainee coordinates, or device fingerprint is stored or logged.
- One active device identity per trainee and one trainee per active public key; approval/replacement is atomic.
- The public QR page never receives a roster or trainee identity until its request is approved.
- An approved identity is returned only when status polling proves possession of the pending request's P-256 private key; the opaque request handle alone is insufficient.
- Treat request handles and recovery codes as credentials: hash request handles at rest, redact both from logs, validate every field, and return only safe static errors.
- Staff actions retain the existing session, writable-role, and request-origin/CSRF protections; public request and polling endpoints are rate-limited and no-store.
- Local SQLite and cloud Edge Function behavior stay contract-aligned; migration is additive and does not update, delete, or backfill attendance or roster rows.

## Review Focus

- Unknown or duplicate phone values must not reveal roster membership publicly — test generic response and staff-only matching in `qr-attendance.test.mjs` and cloud contract tests.
- A stale, replayed, or guessed request handle must not authorize an enrollment or expose a trainee — test expiry, one-time resolution, and rate limits in `qr-attendance.test.mjs`.
- Concurrent approvals must not bind one device to two people or leave two active devices — test competing approvals and replacement atomicity in `qr-attendance.test.mjs` and migration constraints.
- A browser with one legacy record can migrate safely, while multiple legacy records must not be silently merged — test both cases in `qr-attendance-browser.py`.
- Existing manual/tour attendance and duplicate scans must remain unchanged — test record preservation and per-session idempotency in `qr-attendance.test.mjs`.

---

### Task 1: Local device-link lifecycle and route contract

**Files:**
- Modify: `server/schema.sql`
- Modify: `server/sqlite.mjs`
- Modify: `server/qr-attendance.mjs`
- Test: `tests/qr-attendance.test.mjs`
- Modify: `public/modules/qr-attendance-core.mjs`

**Interfaces:**
- `POST qr-attendance/public/device-link-requests` accepts `{batchQrId, publicKey, requestHandle, phone?, activationCode?}` with exactly one locator; the browser persists the 32-byte random handle before sending. Retrying the same request is idempotent only when its batch, session, locator type, and matched trainee/code are unchanged; changed details fail explicitly. It returns `{requestHandle, status: 'pending'}` without a name or match result.
- `POST qr-attendance/public/device-link-status` accepts `{batchQrId, requestHandle, signature}`; `signature` is base64url ECDSA-P256/P1363 over UTF-8 `xcelias-qr-link-status:v1\n${batchQrId}\n${requestHandle}`. Return generic pending/rejected/expired state, or approved enrollment details only after signature verification.
- `GET qr-attendance/device-link-requests?batchId=...` is staff-only.
- `POST qr-attendance/device-link-requests/resolve` accepts `{requestId, action, traineeId?}`, where `action` is `approve`, `approve_replace`, or `reject`.
- SQLite methods: `qrCreateDeviceLinkRequest`, `qrDeviceLinkRequestStatus`, `qrDeviceLinkRequests`, and `qrResolveDeviceLinkRequest` implement the same request/result shapes as cloud RPCs.

- [x] **Step 1: Write failing local tests** named `qrPhoneRequestIsGenericAndWaitsForStaffApproval`, `qrUnknownOrDuplicatePhoneDoesNotEnumerateRoster`, `qrLinkRequestNeedsOpenSessionAndExpires`, `qrRecoveryCodeDoesNotConsumeUntilApproval`, `qrApprovalBindsRequestPublicKey`, `qrLinkStatusRequiresRequestKeyProof`, `qrDeviceCannotBindToAnotherTrainee`, `qrReplacementPreservesOldDeviceUntilApproved`, `qrTrainerQueueRequiresWriterSession`, and `qrLegacyEnrollRouteFailsClosed`. Update the shared test helper to obtain an enrollment through request + staff approval rather than direct enrollment.
- [x] **Step 2: Run** `node --test tests/qr-attendance.test.mjs`; confirm the new tests fail before implementation.
- [x] **Step 3: Add** `qr_attendance_device_link_requests` to `server/schema.sql`, with opaque handle hash, batch, optional matched trainee, public key, optional code reference, pending/resolved status, expiry, and audit fields; add indexes for pending batch requests, handle lookup, and active device constraints. Do not store submitted phone or plaintext recovery code.
- [x] **Step 4: Implement** `normalizeQrPhone(value)` in `public/modules/qr-attendance-core.mjs`; normalize common formatting/country-prefix variants, reject malformed input, and require exactly one batch-local match to suggest a candidate. Unknown/ambiguous submissions still receive the same public pending response and remain assignable by staff.
- [x] **Step 5: Implement** the four SQLite repository methods. Request creation requires an open session, stores only a random handle hash, and expires at the earlier of 30 minutes or session expiry. Approval runs in one write transaction, validates current session/trainee/request, consumes a recovery code only on approval, and revokes a previous device only for explicit `approve_replace`. Code issue/reissue leaves the active enrollment intact.
- [x] **Step 6: Implement** public/staff route validation and authorization in `server/qr-attendance.mjs`. Keep the legacy direct-enrollment route fail-closed with a safe refresh/retry response; it must no longer create an active enrollment. Verify the status signature against the request's stored public key before returning approved identity data. Rate-limit phone/code requests and status polling without logging submitted values or request handles; apply existing origin/CSRF protections to staff mutations.
- [x] **Step 7: Run** `node --test tests/qr-attendance.test.mjs`; all new local route/repository tests and existing QR tests pass.

### Task 2: Private Supabase request schema and atomic RPCs

**Files:**
- Create via Supabase CLI: `supabase/migrations/<generated>_qr_attendance_device_binding.sql`
- Test: `tests/qr-attendance-supabase-migration.test.mjs`

**Interfaces:**
- Add private RPCs for public request creation/status, staff list/resolve, and recovery-code issue/reissue; match the names, states, expiry, and approval semantics in Task 1. Use a new `qr_issue_device_recovery_code` RPC rather than the existing `red_qr_manage(issue_code)` reissue branch, which revokes an active device when the code is issued.
- Every privileged RPC is revoked from `PUBLIC`, `anon`, and `authenticated`, and granted only to `service_role`; the new table has RLS enabled and no direct client write path.

- [x] **Step 1: Add failing migration assertions** for private table/RLS, expiry and handle indexes, unique active trainee/public-key invariants, service-role-only RPC grants, atomic replace behavior, and no statements that update/delete/backfill `daily_attendance`, `trainees`, or `batches`.
- [x] **Step 2: Run** `node --test tests/qr-attendance-supabase-migration.test.mjs`; confirm the new assertions fail.
- [x] **Step 3: Discover the installed CLI syntax** with `supabase --help` and `supabase migration --help`; create the migration using `supabase migration new qr_attendance_device_binding` from the Academy project directory, then edit only the generated file.
- [x] **Step 4: Add** the request table, RLS, indexes, and request/status/list/resolve RPCs; use row locks/transactional constraints so simultaneous approvals cannot violate one-active-device-per-trainee or one-trainee-per-key, and prevent duplicate pending requests for one public key. Add the narrow service-role-only `qr_issue_device_recovery_code` RPC so code reissue does not revoke an active enrollment; only a successful trainer-approved replacement may do that. Keep the migration additive and do not edit the deployed `20261021093706_qr_attendance.sql` migration.
- [x] **Step 5: Run** the migration tests and inspect the generated SQL for grants, expiry cleanup behavior, and absence of existing attendance/roster mutations.

### Task 3: Cloud Edge Function parity

**Files:**
- Modify: `supabase/functions/academy/index.ts`
- Test: `tests/qr-attendance-cloud-contract.test.mjs`

**Interfaces:**
- Public link-request/status handlers call the new service-role RPCs before the staff `requireUser` boundary, with allowed-origin checks, no-store responses, request validation, and generic locator responses.
- Staff list/resolve handlers run only after `requireUser` and existing writable-role authorization.

- [x] **Step 1: Write failing cloud contract tests** for each new public and staff route, no-name-before-approval, safe 401/403 behavior, generic phone match responses, code consumption only on approval, and RPC call argument parity with Task 1.
- [x] **Step 2: Run** `node --test tests/qr-attendance-cloud-contract.test.mjs`; confirm failures.
- [x] **Step 3: Implement** Edge Function routing and RPC calls. Validate phone/code/public-key/request-handle shapes, verify the P-256 status signature before requesting approved identity data from the service-role RPC, rate-limit request creation and polling, use `qr_issue_device_recovery_code` for code issue/reissue (never the revoking legacy `red_qr_manage(issue_code)` branch), fail closed on the legacy direct-enroll route, return safe static errors, and never log raw phone/code/location values or expose the opaque handle outside its requesting browser. Enforce the existing origin/session authorization boundaries on each route.
- [x] **Step 4: Run** local/cloud contract tests and `npm run check` from the Academy project; require exact parity for pending, approval, replacement, expiry, and rejection outcomes.

### Task 4: Trainee page pending flow and browser identity migration

**Files:**
- Modify: `public/qr-attendance/index.html`
- Modify: `public/qr-attendance/qr-attendance.mjs`
- Modify: `public/qr-attendance/qr-attendance.css`
- Create: `tests/qr-attendance-browser.py`

**Interfaces:**
- The participant page stores one origin-scoped P-256 identity and pending handle in IndexedDB; it submits either phone or recovery code, then signs each status poll with the same private key until approved or expired.
- A previously approved browser shows only its bound trainee and the existing check-in action; no user-supplied trainee ID is sent to challenge/check-in endpoints.

- [x] **Step 1: Write failing browser tests** for phone/code request form, generic waiting state, approval transition, no check-in while pending, no trainee switch after approval, data-cleared recovery, one legacy IndexedDB record migration, and multiple legacy records requiring staff assistance.
- [x] **Step 2: Run** `python tests/qr-attendance-browser.py`; confirm the new states are absent.
- [x] **Step 3: Update** the participant HTML and bilingual copy for phone, recovery-code fallback, pending approval, rejection/expiry, replacement help, and generic non-enumerating errors; preserve the Academy visual identity and location notice. Disclose that hosting/security systems may process connection metadata.
- [x] **Step 4: Upgrade** IndexedDB safely to one origin-scoped identity record. Reuse a single valid legacy enrollment when present; if multiple legacy records conflict, do not choose or revoke one automatically—show trainer-assisted recovery.
- [x] **Step 5: Implement** pending request creation and no-store status polling; stop polling when the page is hidden, closed, expired, or the session closes. Persist the key before requesting; reveal the trainee identity only after approved status. Keep the old direct-enroll call disabled and cache-bust the participant script so old clients refresh to the fail-closed flow.
- [x] **Step 6: Run** browser tests at mobile/desktop sizes; assert no roster/name leak, no attendance request while pending, reduced-motion compatibility, and one check-in action for the bound identity.

### Task 5: Trainer approval queue and safe device replacement

**Files:**
- Modify: `public/modules/qr-attendance-trainer.mjs`
- Create: `public/qr-attendance/device-queue.css` (loaded on demand by the trainer module)
- Test: `tests/qr-attendance-trainer.test.mjs`
- Test: `tests/qr-attendance.test.mjs`

**Interfaces:**
- The batch QR panel lists pending requests with candidate (if unique), request time, and whether a device is already active; staff may match unresolved requests to an active trainee in that batch.
- Approval actions require a confirmation for replacement; the old enrollment remains valid until the approval transaction succeeds.

- [x] **Step 1: Add failing trainer UI tests** for pending list, candidate matching, approve, reject, explicit replacement confirmation, and no action for read-only users.
- [x] **Step 2: Run** `node --test tests/qr-attendance-trainer.test.mjs`; confirm failures.
- [x] **Step 3: Add** the pending-request queue and accessible status/actions to the batch attendance panel. Escape trainee-controlled text and poll only while the panel is open/visible; allow manual refresh. Show distinct approval and approve-replacement actions, with confirmation before replacement. Update recovery-code copy to clarify that reissuing replaces only the unused code; the current device remains active until explicit replacement approval.
- [x] **Step 4: Run** local tests proving current device remains usable before replacement approval and fails after successful replacement, plus session/manual/tour attendance preservation. Backend semantics are supplied by Tasks 1–3.

### Task 6: Full verification, additive rollout, commit, and push

**Files:**
- Verify: all files from Tasks 1–5

- [x] **Step 1: Run** `npm test` and `npm run check` in `New Xcelias Data/red-academy`; run browser tests and the root build as relevant. Review the final diff against the security checklist (input validation, parameterized SQL, authorization/RLS, CSRF/origin controls, XSS, rate limits, secret/log redaction, and generic errors). Fix regressions before deployment.
- [x] **Step 2: Build** with `npm run cloud:build`; inspect the generated QR page and Edge bundle to confirm current Xcelias URLs, no secrets, and updated participant asset cache version.
- [x] **Step 3: Inspect the remote migration plan** with `supabase db push --dry-run --skip-vault --project-ref …`. Stop unless the dry run shows only the new device-link migration; do not run any data import or mutation against batches, trainees, or attendance.
- [x] **Step 4: Apply** only the reviewed additive migration, then deploy the Academy Edge Function and website in migration-before-code order. Verified Supabase reports no pending migrations, the deployed function returns the expected safe validation response for a deliberately invalid QR, and the GitHub Pages build/deploy both succeeded. The migration creates private device-link storage/RPCs and contains no batch, trainee, assessment, or attendance data mutation.
- [x] **Step 5: Commit** the feature changes and push `main` to `origin`; verify the deployment reports ready. Commit `6880e7c` is on `origin/main`; GitHub Pages deployment run `39758382919` completed successfully. No physical-phone check is claimed because no approved live test trainee was used.

