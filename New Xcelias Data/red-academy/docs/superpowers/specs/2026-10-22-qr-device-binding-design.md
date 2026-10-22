# QR Attendance: Trainer-Approved Device Binding

**Status:** Implementation complete; final verification and the additive production migration/deployment are pending.

## Goal

Reduce proxy check-ins by ensuring that one approved browser/device identity is linked to one trainee, and that one such identity can submit attendance only for that trainee in each open session. Trainees should not need SMS, WhatsApp, a separate account, or a business messaging setup.

## User-approved behavior

- A trainee scans the existing stable batch QR and submits their saved phone number; a one-time reception code remains a recovery/matching fallback.
- The submission creates a pending link request. It does not create an enrollment or attendance record.
- A trainer verifies the person is physically present and approves or rejects the request.
- Each approved device identity belongs to only one trainee. A trainee has at most one active device identity.
- A replacement request never disables the current device by itself. A trainer explicitly approves replacement; only then is the former identity revoked.
- After approval, the trainee page has no name picker and can check in only the linked trainee. It may record that trainee once for each open scheduled session; later sessions remain available.
- Existing attendance records and the existing location-review behavior are preserved.

## Important browser limitation

A website cannot reliably identify a physical handset across separate browsers or after the browser's site data is cleared. It cannot read a dependable hardware ID or MAC address. Browser fingerprinting is not an acceptable substitute. A new browser profile or cleared storage is therefore treated as an unrecognized device and must go through trainer approval. Location is a useful risk signal, not proof of identity or presence.

The identity key is generated with Web Crypto and stored in the origin's IndexedDB. Creation is atomic across tabs, and request submission is serialized with the Web Locks API or an IndexedDB lease fallback. Use one origin-scoped identity key, not a separate key per batch QR, so the same browser profile cannot switch identities by scanning another batch. The server stores its public key and enrollment state. Reusing the same browser profile reuses the identity; a new profile creates a new pending request. Existing active enrollments are grandfathered and are not automatically revoked by the migration. If an old browser has multiple per-batch enrollments, do not guess which identity to retain; require trainer-assisted reconciliation.

## Participant and trainer flow

1. **Request:** During an open session, an unlinked browser asks for the saved phone number or a private recovery code. The browser creates a keypair and submits the public key with the batch QR reference. It generates and persists a random request handle before sending so retries after a lost response are idempotent. The same handle is accepted only for the same batch/session and matching locator result; changed details produce an explicit conflict instead of silently reusing a different trainee match. The server finds a unique active trainee match inside that batch when possible. It does not return a roster or trainee name before approval. Unknown or ambiguous phone/code matches remain unresolved for staff matching rather than being auto-enrolled. A request is valid for at most 30 minutes and never beyond the open session; it cannot be approved after that session closes.
2. **Wait:** The public page receives only an opaque, unguessable request handle and a generic pending message. It polls the request status without caching and signs each poll with the same P-256 private key used to create the request. Possession of the handle alone never reveals trainee identity or other personal data. It cannot check in while pending, rejected, expired, or unresolved.
3. **Verify:** An authorized trainer sees pending requests in the batch QR-attendance panel. A unique phone match is a suggested candidate, not proof. The trainer confirms the person in front of them, can select the correct roster entry for an ambiguous/unmatched request, then approves or rejects it. The queue never stores or displays the submitted phone number; it shows only the matched trainee (when known), batch, request time, and whether this is a replacement.
4. **Approve:** Approval is atomic. It validates the pending request, batch and trainee status, and device uniqueness; consumes the recovery code if used; creates the enrollment; and returns the trainee identity only to the requesting browser key. If an active device already exists for that trainee, replacement requires a distinct explicit trainer action and confirmation. The old enrollment is revoked in the same transaction that activates the replacement.
5. **Daily check-in:** The linked page displays only the bound trainee and the existing **I’m here** action. The server derives the trainee from the enrolled device, validates the signed challenge, active session, location result, and existing attendance, then records no more than one QR attendance row for that trainee/session. A prior manual, tour, or other attendance row is preserved and surfaced as already recorded; the QR flow never overwrites it.
6. **Recovery:** A lost phone, cleared site data, or new browser requires a new pending request and trainer verification. Reissuing a code alone does not revoke the currently working phone. Staff can reject or expire stale requests; resolution actions are audited.

## Server/API and persistence design

- Keep public participant endpoints separate from staff endpoints. Add public operations to create a device-link request and poll its status. Verify status-poll signatures against the request's stored public key before returning approved identity data. Add authenticated staff operations to list requests for a batch and resolve them (approve, approve-and-replace, reject, or match to a roster entry).
- Public responses are generic and never disclose whether a phone belongs to a particular trainee. Phone matching is limited to the QR's batch, uses consistent normalization, is rate-limited, and runs in Edge Function memory against the active batch roster. The submitted number is not persisted in application storage or sent to database RPCs; only a unique candidate trainee ID (or an unresolved state) goes to the request RPC. The application stores only a keyed digest of the source address for abuse throttling; hosting/security infrastructure may separately process or log connection metadata such as source IP, which is disclosed on the participant page.
- Local phone/code locator throttling uses a domain-separated HMAC key, never a plain hash of a low-entropy phone number. `QR_RATE_LIMIT_SECRET` can preserve rate-limit buckets across local server restarts; if unset, a random in-memory key is generated and those temporary buckets reset when the process restarts.
- Add an additive private `qr_attendance_device_link_requests` table in both the local SQLite schema and Supabase migration. It stores an opaque request ID, batch, optional matched trainee, public key, optional recovery-code reference, status, expiry, and staff resolution audit fields. It stores no raw phone number, exact coordinates, or private code.
- Keep the existing one-active-enrollment-per-trainee and one-active-public-key constraints. Approval and replacement must be serialized/atomic so concurrent requests cannot attach one key to multiple trainees or leave two active devices for one trainee.
- Staff resolution routes require the existing RED Academy staff session and writable trainer role. Public routes use the existing QR origin/rate-limit protections and safe static errors. Supabase tables remain RLS-enabled and unavailable for direct client writes; privileged RPC execution stays service-role-only. Local SQLite behavior and cloud Edge Function behavior must remain contract-aligned.
- Recovery-code issue/reissue must not revoke an existing device at issue time. A code is consumed only when its pending request is approved. Unapproved, rejected, or expired requests do not alter attendance or the current device enrollment.
- The migration is additive: no batch, trainee, assessment, or attendance rows are updated, deleted, or backfilled. The existing QR migration is immutable; this feature gets a new migration.

## Failure handling and privacy

- A pending, rejected, expired, or unresolved device request never creates attendance.
- Repeated requests are rate-limited; the random unguessable request handle is stored hashed server-side, and approved identity data additionally requires proof of the associated private key. Pending requests expire after 30 minutes or when their session closes, whichever comes first. A duplicate request with the same browser key and handle is safe to retry only if the batch, session, locator type, and matched trainee/code are unchanged.
- A device already linked to another trainee cannot switch identities or submit for a second trainee. It receives a safe recovery message. Staff replacement is explicit and audited.
- Check-in still uses the existing foreground location check. Outside, uncertain, denied, or unavailable location creates the existing staff-review event rather than an automatic absence or a confirmed-fraud label.
- No raw device fingerprint, IMEI/MAC, submitted phone, or trainee GPS coordinates are stored in application data or application logs. Hosting/security providers may process connection metadata for abuse prevention, as disclosed to participants. Logs and errors must not reveal phone lookup results, keys, or private codes.

## Verification requirements

- Local and cloud tests cover: matching and ambiguous phone requests; generic public responses; no roster/name leak before approval; pending requests cannot check in; trainer-only approval/rejection; approval bound to the submitting key; no device identity switching; one active device per trainee and one trainee per device; replacement leaves old device active until approval and revokes it atomically afterward; code fallback is consumed only on approval; expired/rejected requests; cleared storage/new browser requiring approval; duplicate/manual/tour attendance preservation; session idempotency/concurrency; rate limits; and safe errors.
- Browser tests cover the pending/waiting state, trainer-approved identity state, lack of a trainee picker after approval, recovery after cleared storage, and the replacement confirmation path.
- Run the full RED Academy tests and build. Validate the new Supabase migration with a dry run and inspect that it is the only pending schema change before any live application. Never use live attendance rows as fixtures.

## Rollout boundary

Deploy the additive migration before the cloud Edge Function and static page changes. Existing active enrollments remain usable; new enrollment attempts use the approval queue. No migration or test may write to live batch/attendance data. A production migration is limited to creating the new private request table/indexes and narrowly scoped RPCs/policies.
