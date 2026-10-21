# QR attendance: feasibility and recommended flow

> **Design status:** This early feasibility note predates the revised proposed design. Its recommendation for a rotating/session-specific printed QR is superseded by [`docs/superpowers/specs/2026-10-21-qr-attendance-design.md`](superpowers/specs/2026-10-21-qr-attendance-design.md) and [`docs/superpowers/plans/2026-10-21-qr-attendance.md`](superpowers/plans/2026-10-21-qr-attendance.md): one stable printed QR per batch, server-controlled sessions per scheduled date, one-time in-person activation codes, and venue-based location review. Review the updated spec and plan before implementation.

Research note, 20 October 2026. This is a design study only; it changes no
attendance data and is not a production implementation.

## What the current Academy already supports

- RED Academy already has a local QR encoder that accepts HTTPS URLs, but it
  does not identify a trainee or prove a scan happened in the classroom:
  [`qr-code.mjs`](../public/modules/qr-code.mjs).
- Manual attendance is saved in `daily_attendance`. It records batch, trainee,
  scheduled date, status, and optional arrival/departure timestamps. The server
  validates the batch date and blocks duplicate trainee/date rows. SQLite and
  the Supabase schema both enforce a unique native attendance row per
  `(trainee_id, date)`:
  [`schema.sql`](../server/schema.sql),
  [`operations.ts`](../supabase/functions/academy/operations.ts),
  [cloud schema migration](../supabase/migrations/20260920190000_academy_cloud_schema.sql).
- The normal Academy workspace is staff-authenticated. Activity participants
  have separate private links, but those links are not a general trainee login
  or proof of attendance identity. A QR check-in needs its own narrow server
  flow; it must not expose the staff workspace or accept an arbitrary trainee
  ID from an unauthenticated browser.
- Local mode uses SQLite and cloud mode uses Supabase. Any kept feature needs
  equivalent validation in both paths and, if new tables are needed, a reviewed
  cloud migration before deployment.
- The production config currently disables the separate participant origin;
  see [`CLOUD_DEPLOYMENT.md`](CLOUD_DEPLOYMENT.md). A pilot can use the current
  Academy host, but the trainee-facing `join.xcelias.com` URL should wait until
  that domain/configuration is actually enabled.

## The key security answer

**One QR can serve the whole batch.** It should identify an open attendance
session (batch + scheduled date + expiry), not a person. Every trainee scans the
same current code, but each request must be tied to a roster identity and can
create at most one attendance record for that trainee/date.

**The QR alone cannot stop a trainee from checking in for a friend.** It is a
bearer credential: anyone who receives a live picture/link can try to use it.
Rotation and expiry reduce the usefulness of an old screenshot, but do not stop
someone from forwarding the current code in real time. This is an inference
from bearer-token and replay-resistance guidance, not a QR-specific guarantee.
([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html),
[NIST SP 800-63B-4, replay resistance](https://pages.nist.gov/800-63-4/sp800-63b.html))

Selecting a name from a list is therefore not identity verification. A stronger
flow requires each trainee to authenticate to an account already linked to the
correct roster record, plus occasional trainer spot-checks. Accounts are not
currently available to trainees in the Academy, so identity onboarding is the
main product decision—not QR generation.

Phone OTP is one possible account-verification method, but it is not proof of
physical presence. Firebase documents that phone numbers can be transferred,
requires appropriate user consent for phone auth, and stores submitted numbers
for abuse prevention; SMS also introduces provider cost, delivery, and abuse
limits. ([Firebase phone authentication](https://firebase.google.com/docs/auth/web/phone-auth),
[Firebase Auth limits](https://firebase.google.com/docs/auth/limits))

## Recommended workflow

1. **One-time roster identity setup:** staff verifies each trainee in person and
   links them to an individual sign-in identity. If that setup is not ready,
   the fallback must be trainer-confirmed name selection, explicitly treated as
   lower assurance—not “fraud-proof” automatic attendance.
2. **Trainer opens check-in:** choose an active batch and a scheduled date,
   then start a time-limited attendance session. The backend, not the browser,
   decides the batch, date, open/close state, and allowed trainee roster.
3. **Display one rotating QR:** use a random, short-lived session challenge
   (for example, rotate about every 30–60 seconds after testing real scan and
   sign-in latency). The event remains open for a trainer-controlled check-in
   window. The code is reusable by all eligible trainees during that window;
   it is not consumed by the first scan. Do not encode names, phone numbers, or
   other personal data in it. (Token expiry and rotation are design choices;
   the exact interval is not mandated by a standard.)
4. **Trainee scans and signs in:** the server verifies the trainee identity,
   session challenge, enrollment, scheduled date, and that the session is open.
   It derives the trainee ID from the authenticated identity rather than
   trusting a submitted ID.
5. **Create one attendance row:** on the first valid scan, record `Present`,
   the scheduled date, and the server-received timestamp. Repeated taps/network
   retries return the existing result. The existing unique `(trainee_id, date)`
   index is a good foundation for duplicate protection; writes should remain
   atomic in both SQLite and Supabase. PostgreSQL documents unique indexes as
   rejecting duplicate keys. ([PostgreSQL unique constraints](https://www.postgresql.org/docs/16/ddl-constraints.html))
6. **Trainer sees live check-ins and exceptions:** allow a manual correction
   with an audit note. Do not infer `Absent` just because someone did not scan;
   the trainer completes the roll call and marks absences explicitly. Existing
   manual attendance remains the fallback for dead phones, network trouble,
   and disputed identity.
7. **Close the session:** expire the QR and stop accepting scans. Keep only the
   attendance and audit facts needed for operations; do not log raw QR tokens,
   OTPs, or auth credentials.

The server should create timestamps in UTC and display them in Cairo time; a
phone's clock is not authoritative. A single entry QR records arrival only.
Departure remains blank unless there is a separate exit scan or staff records
it. “Assessment day” should be set by the trainer/session configuration, not
inferred from scanning. Current late-preview logic uses an 11:00 AM threshold;
if batches have different start times, that policy needs a schedule-level start
time before QR lateness can be reliable.

## Recommendation and rollout

Start with a small pilot on a test batch, not live attendance: one trainer,
5–10 test identities, then a 40-device load/concurrency test. Keep the QR
session-specific, bind every check-in to a roster identity, use server time,
test retries/duplicate scans, and verify the resulting rows appear in the
existing attendance register, checklist, reports, and exports.

The recommended product is **shared rotating session QR + individual trainee
sign-in + trainer live review**. It removes repeated manual typing and blocks
name-only impersonation, while acknowledging that account sharing or real-time
collusion can still happen. If individual trainee accounts are not acceptable,
the honest alternative is QR convenience plus trainer confirmation; no
browser-only shared QR can guarantee that the named person is physically
present. Avoid GPS, selfies, and device fingerprinting in the first version:
they add sensitive data, friction, and false confidence without fixing the
fundamental live-relay problem.
