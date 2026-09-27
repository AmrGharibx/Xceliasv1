# RED ACADEMY
## Private training operations / Version 3.0 / Notion migration

**The application is already populated. No manual import or CSV mapping is required.** This is the private RED application, not a demo: 42 real batches, 903 roster/enrollment entries, 2,606 daily records, 264 checklist records, 847 assessment records and 55 companies are in `data/red-academy.db`.

Missing data stays missing. Batches 44-57 are excluded from operational screens as demo placeholders. Batch 25 is not present in the supplied export. Original source pages, relationships and migration decisions remain inspectable after sign-in under **Notion import & review**.

## Start in a fresh folder

Extract the ZIP into a **new folder**. Keep any previous workspace and its database as a backup. **Do not copy the old v2 database, old `data` folder or old `.env` files over this version.** Do not replace this populated database with an empty one.

The `red-academy` folder must include `data/red-academy.db`. Install Node.js **22.16 or newer**, then double-click **START-WINDOWS.bat** on Windows. Alternatively, open a terminal in that folder:

```sh
npm start
```

Open **http://localhost:3000**. Keep the terminal open while using the academy. This edition requires no `npm install`, build step, Python installation, database subscription or AI subscription to run. Python is used only by optional source-migration/verification tools. An experimental SQLite warning on the tested Node version is not an application failure.

The first launch prints a one-time setup code. Enter it and choose the administrator's name, work email and password. Then sign in: **the historical data is already there**. No accounts, invitations or passwords were imported from Notion; there is no shared default login. A setup code expires after 24 hours, is replaced when an unconfigured server restarts, and is disabled permanently when setup is completed.

To check the untouched package before setup, run:

```sh
npm run data:status
node scripts/verify-import.mjs --baseline
```

The first command should show **42 batches**. After the workspace is in use, run `npm run verify:import` without `--baseline`; it checks archive and database integrity without demanding that operational counts remain unchanged.

## Your team

Use **Workspace settings -> Manage team -> Invite team member**. Choose the person's name, work email and role. Share the generated link through a trusted private channel; **the application does not automatically email it**. Invitations expire after 48 hours and are single-use. Administrators can revoke pending invitations or deactivate accounts.

Administrators can manage records, delete, export and manage access. Instructors can read, edit and export but cannot delete or manage accounts. Viewers are read-only. All authorized RED users can read the shared workspace; company filters are not separate security boundaries. Invite only staff authorized to see all its records.

`localhost` works only on the server computer. Colleagues on other computers need a reachable RED-controlled HTTPS server. The existing self-hosted path is in `docs/DEPLOYMENT.md`; the static-shell, protected-database cloud path is in `docs/CLOUD_DEPLOYMENT.md`. No live RED server, domain or account has been changed by this package.

## Finding the imported data

**Batches:** all 42 real batches are present, including undated batches and those with only a roster or only some related records. The status board includes a Not recorded lane. Dates are labeled by their source: supplied range, observed attendance, single checklist period, or not recorded. Past dates do not silently change a source status to Completed.

**Trainees:** 903 rows are enrollment/profile records, not 903 verified unique people. They comprise 872 canonical master rows, 13 profiles recovered from explicitly named attendance/checklist records, and 18 supplemental Batch 43 enrollment links. A person in more than one batch can have more than one enrollment. Unknown email, telephone, company and other fields are not invented.

**Attendance records:** this full register includes every retained daily record, including unassigned entries, unknown statuses and original time discrepancies. The daily attendance screen is the roster-based entry workflow; it links to the complete register. Unknown status does not count as absence or mark a named trainee as recorded.

**Ten-day checklist:** all periods are retained, including both genuine sets in Batch 30. A checklist is independent of attendance; checking a day does not invent a daily entry. Latest-period profile summaries do not delete older periods.

**Assessments:** all saved source records are visible, including partial, shared, unassigned and duplicate historical records. Missing skills remain blank. Explicit source zeros remain zero. Original outcome labels, comments, reports and assessment-reported attendance totals are preserved separately from daily-log totals. Graded averages exclude incomplete, explicitly not-assessed, shared and ambiguous duplicate results; excluded records remain inspectable.

**Notion import & review:** batch coverage, source decisions, original Markdown/properties/relationships, record links and review notes. Administrator acknowledgement means reviewed, not that missing information has been invented or a time discrepancy corrected. Editing a working record never rewrites the original source archive.

## Trainer Activities Studio

Writable trainers can create shared, trainer-authored challenges with 3–12 scenario rounds, four distinct answer choices per round, a skill tag, coaching nudge/takeaway, and up to eight optional active-recall cards. The server grades them through the same private-link and XP flow as the curated library; trainer-made items can also be hosted in live phone/team rooms. Answer keys are never returned by learner or library APIs. Published challenge versions are immutable so existing scores stay reproducible. Archiving hides a version from new assignment/live-room setup but keeps its current assignments, private links, results, recommendations, and live-room snapshots working. Custom challenge cloud support additionally requires `supabase/migrations/20260924200000_studio_custom_challenges.sql` after the four existing Studio migrations and before redeploying the Edge Function.

The portal's **Trainer Activities** card opens a standalone trainer workspace. It is intentionally separate from both the older Activities page inside Academy Operations and the original RED Materials game library; both remain available as fallbacks. The Studio uses the same invited staff sign-in, batch/company filters and canonical trainee roster rather than creating a second set of trainee records.

The native Academy Studio library contains eight curated challenges—**Discovery Sprint**, **Product Knowledge Check**, **Objection Arena**, **Needs Decoder**, **Trust & Ethics**, **Follow-Through Lab**, **Viewing Debrief**, and **Team Handoff Relay**—covering 40 scenario questions and 24 study cards. Each has an optional warm-up followed by a five-round, one-question-at-a-time challenge. Challenge cards launch directly into assignment or live-room setup with that challenge preselected. Trainees can reveal an optional coaching nudge before answering: accuracy is unaffected, while a correct independent answer earns 100 XP and a correct nudged answer earns 70 XP. The server stores the choice with the answer, so the award and coaching review remain consistent when a completed link is reopened; answer keys stay server-side until submission.

A trainer assigns a challenge to a batch or selected roster, then issues an individual private link for each trainee. Opening a link marks that trainee In Progress; one server-graded submission saves their score, review notes and earned XP to the shared assignment. Learners see a small skill signal with each result. Writable staff see a private practice focus derived from that trainee’s submitted answers and can assign the matching next challenge to just that trainee; raw learner answers remain private. A completed run can award a Perfect Signal, Combo, Curious Mind or Independent Thinker achievement. The staff view refreshes from the same local event stream or cloud revision signal. Its private XP ladder adds results across completed challenges and shows five experience levels: First Step, Explorer (500 XP), Navigator (1,500), Mentor (3,000) and Legend (5,000).

The **Classroom Pulse** closes the group coaching loop: staff can scope it to a batch and/or company, see aggregate accuracy and response coverage by skill, and launch the most relevant next challenge either as a live team round or private practice. When learners have repeated a skill, it compares each learner’s first and latest challenge and reports the anonymous group trend (improving, steady, or declining); first-time practice is not misrepresented as progress. It is derived only from completed, server-graded Studio submissions; it contains no names, answer choices, or individual scores, and does not mix in attendance, assessments, or temporary live-room points. Small cohorts are explicitly marked as early signals. The local and cloud endpoints share the same calculation and need no database migration.

The custom challenge builder can optionally draft scenario rounds and active-recall cards with the existing Gemini integration. It requires a trainer's explicit consent, sends only the challenge brief and lesson notes (never roster data), rejects likely email/phone details, and returns an editable draft that is not saved or assigned until a trainer reviews and publishes it. AI challenge drafting shares the existing `AI_REPORTS_ENABLED` and `GEMINI_API_KEY` configuration and is rate-limited separately.

For face-to-face sessions, writable staff can **Host a live room** in either discussion mode or phone mode. Phone mode creates a ten-character join code and link; learners join without a staff login, choose a class nickname/team, and answer privately from their own devices. The host sees anonymous response counts and a synchronized timer, then reveals the answer and coaching note to the whole room. Correct answers earn temporary room points with a capped streak bonus; a live team/learner leaderboard and replay make it easy to run another set. Trainers can recover an open or completed room after reloading: the room resumes at its saved round and score, rotates the join code, and existing learners reconnect with their private seat token. These are not Academy XP and never change attendance, assessments, assignments or trainee profiles. Room codes and phone-seat tokens are stored only as hashes on the server (the phone keeps its own token in session storage so it can reconnect). Answer keys stay hidden from learners until reveal. Rooms expire four hours after creation; expired participant/answer data is purged during live-room cleanup. The original talk-it-out mode remains available and unchanged.

**Sequence Sprint** adds a different kind of live round to that room: teams reason about the order of three real-world client-care moves, and phone players arrange the moves with accessible up/down controls before locking their private answer. Its five short rounds practice discovery, honest verification, viewing debriefs, helpful follow-up and consent-based handoffs. The shuffled steps are visible before reveal, while the coaching order and explanation stay server-side until the trainer reveals them; the host sees response totals, never a misleading multiple-choice distribution. Correct sequences use the existing reveal-time room scoring and replay flow, so points remain temporary and no trainee, attendance, assessment, assignment or XP data changes. This live-only activity is not published as a graded learner quiz and requires no database migration.

After a phone-room reveal, the trainer also gets a **Live Debrief Lens**: a short next-step suggestion calibrated to the room’s revealed result. Rooms with fewer than three responses are explicitly treated as a small-room conversation cue (not a class trend); larger groups receive a pause/rebuild, reasoning, or stretch prompt according to the aggregate. In quiz and Sequence Sprint rounds, learners may also mark **Still thinking** or **Ready to stand by it**. Their own selection is private before reveal; trainers see only an anonymous room aggregate afterward, with accuracy hidden for any confidence group smaller than three. A reflective prompt helps the trainer compare confidence with correctness without identifying a learner. These signals expire with the room and never become a grade, assessment, XP award, or trainee record. Anonymous Class Pulse remains ungraded and does not ask for confidence.

From any step in **Facilitation mode**, trainers can also launch a **Class Pulse**: one editable, anonymous, ungraded check-in with two to five response choices and an optional timer. Learners join without a name, login, or team; they can change their choice until reveal. The facilitator sees only aggregates (never response-by-person data), and the choice distribution stays hidden from everyone until at least three people have responded. Revealing a pulse never runs quiz scoring and never changes Academy records. Finishing returns the facilitator to the same session step; room responses expire with the live room.

The **Role-play Lab** adds ten spoken client scenes to the Studio and the session coaching huddle, spanning discovery, price objections, verification, viewing feedback, follow-up, handoffs, investment claims, service recovery, consent and budget boundaries. Trainers can lead a rep or select pair practice; in pair mode, Partner A and Partner B automatically exchange advisor/client roles on each replay. Trainers choose a scenario, reveal client lines one at a time, use a gentle optional response timer, then open a coaching lens with observable conversation moves, one possible phrase, a watch-out, and a debrief question. A surprise-scene picker, repeat reps, role swaps and temporary in-room move tokens make it easy to run again without turning practice into a grade. It uses no microphone, transcript, trainee names, API calls, or saved learner data; it cannot change attendance, assessments, assignments or XP. Escape/close also stops its timer, and returning from a session restores the same facilitator step.

The built-in Role-play Lab uses no microphone, transcript, trainee names, or saved learner data. Its optional AI co-planner makes a provider request only after the trainer checks a separate consent box; it sends only the selected learning focus and trainer-entered lesson notes, rejects likely email/phone contact details, and never sends roster, grade, attendance, assessment, or XP data. Generated scenes are clearly marked temporary, stay in browser memory only until the lab closes, and use the same three-turn, coaching-lens, retry and scene-cycling experience as curated scenes. The trainer must review all generated content; it never grades or records a learner. AI uses the existing Gemini configuration and is rate-limited separately.

Learner links are bearer credentials: anyone who receives a trainee's private link can act as that trainee. Share each link only with its named trainee. Creating links again rotates unsubmitted links; closing an assignment or reaching its due date stops new submissions. Completed trainees can reopen their own link to see their saved result. The answer key stays on the server and is not sent with the quiz. In-progress answer choices, the current round, and any hint-use flags autosave privately against that same link; reopening it offers a **Continue challenge** action. Version checks prevent an older open tab from silently overwriting newer progress. Drafts are never included in trainer views, are not grades or XP, and are cleared atomically when the final answer is submitted. Optional confidence reflections and study-card self-ratings are never part of a draft.

For an online cloud deployment of the Studio learner flow and phone rooms, apply these migrations in order: `supabase/migrations/20260924120000_trainer_activities.sql`, `supabase/migrations/20260924140000_activity_studio_learner_loop.sql`, `supabase/migrations/20260924160000_activity_live_rooms.sql`, `supabase/migrations/20260924180000_activity_live_four_teams.sql`, `supabase/migrations/20260924200000_studio_custom_challenges.sql`, `supabase/migrations/20260924220000_activity_session_plans.sql`, `supabase/migrations/20260924230000_activity_live_pulse_reveal.sql`, `supabase/migrations/20260925000000_activity_learner_quiz_drafts.sql`, `supabase/migrations/20260925200000_activity_session_quiz_link.sql`, and `supabase/migrations/20260925220000_activity_live_confidence.sql`; redeploy the Academy Edge Function and static cloud build afterward. The live-room and session-plan tables are private to the service role; session plans, Class Pulses, private quiz drafts, and live confidence reflections do not create or rewrite batch, trainee, attendance, assessment or XP records. Do not apply migrations to a production project until its normal backup and deployment checks are complete.

## Records, persistence and safety

### Shared classroom session board

Writable trainers can save a batch- and optional company-scoped run-of-show for each class date: an opening retrieval prompt, a linked live challenge, a coaching huddle, and an exit ticket. Each step can be checked or reopened; progress is shared across trainer sessions, audited, and version-checked so simultaneous edits do not overwrite each other. Facilitator prompts can be edited and are saved with the session. An optional, consent-gated Gemini co-planner can draft the four prompts from the selected skill, challenge metadata, and trainer-supplied lesson notes; no trainee, roster, score, attendance, or answer-key data is sent, and the draft remains unsaved until a trainer reviews and saves the plan. The challenge step opens the existing live-room setup with the planned quiz selected. A future plan shows when its private follow-up quiz unlocks; on the planned date, **Assign a private quiz** opens the linked challenge with the planned batch, company roster, and due date prefilled, then prepares individual trainee links for the trainer to share (nothing is sent automatically). Exactly one assignment can be linked to a plan: the server rejects early or duplicate requests atomically, and every trainer sees live completion progress plus a shortcut to the same assignment. Batch session dates are suggested, not edited, and planning or assigning this Studio quiz never creates attendance or formal assessment records. Local persistence is in `activity_session_plans`; cloud support additionally requires `supabase/migrations/20260924220000_activity_session_plans.sql` followed by `supabase/migrations/20260925200000_activity_session_quiz_link.sql`. Tests and builds never apply cloud migrations.

### Academy Studio study warm-up

The optional learner warm-up is active recall, not just a card flip: the trainee tries to explain the prompt before revealing the takeaway, then privately marks it as clear or worth one revisit. Only self-marked cards receive a second look. Any still-fuzzy ideas appear in a final focus recap before the quiz. These self-ratings are not grades, are not saved or sent to staff, and do not affect XP or the trainee record. The learner can restart the warm-up or skip directly to the challenge.

After submission, any missed challenge rounds can optionally enter a private **Second Chance** practice loop. Learners recall their response before revealing the coaching note, can flag one round for a single extra look, and finish with a private focus recap. It is repeatable from the saved result, runs only in browser memory, and never creates another submission, grade, Academy XP award, or trainer-visible self-rating.

During a challenge, learners may optionally note whether they are still thinking or feel sure. The result screen privately compares confidence with correctness as a metacognitive reflection; these ratings stay in page memory, are omitted from the submission request, and are never persisted, shown to staff, or used for grading/rewards.

Trainer-led live rooms can be split into two, three, or four named teams. Team membership and scores synchronize across learner phones, survive room recovery, and stay temporary to that room; the existing two-team rooms remain compatible.

The app uses one persistent Node/SQLite server with real role enforcement and server-sent updates. Business data is not stored in browser LocalStorage or cached offline. New operational edits are version-checked and transactional. Assessment edits retain previous versions. For new batches, choose ten session dates. Imported historical batches can retain unknown or irregular dates; recording a new real attendance date adds that date without fabricating a complete historical schedule.

There is no seed generator or reset on restart. Test fixtures under `tests/` are never loaded by the running application. Native new assessment inputs start at zero until the instructor supplies scores; imported missing fields do not inherit that default.

**This ZIP contains real personal and performance data. Keep the ZIP, database, original source archive, exports and backups private. Do not publish them to GitHub, static hosting or a public file link.** `data/` and `archive/` are excluded from Git and Docker image builds; the running server exposes only `public/`. The Docker template deliberately mounts the imported data directory instead of baking trainee data into an image.

A normal record deletion removes current linked operational rows but does not erase the original Notion archive, saved revisions or audit history. See `docs/SECURITY.md` before relying on deletion for retention/erasure purposes.

## Exports and backups

The app exports genuine seven-sheet Excel files, CSV and loaded JSON snapshots, plus browser Print / Save as PDF. The workbook retains partial-score blanks and separate assessment/daily totals. Filters scope exports as stated in the export dialog. These exports are not a complete system backup.

Use the database backup command:

```sh
npm run backup
# Or choose a new file that does not exist:
node scripts/backup.mjs ./backups/red-academy-safe-copy.db
```

A database backup includes accounts, history and all original source pages. Restrict and encrypt backups, retain a protected off-server copy, and test restoration. The command refuses to overwrite an existing file. Recovery, session invalidation after restoration and password-reset instructions are in `docs/DEPLOYMENT.md`.

## Source and reconciliation

The original `Notion Data.zip` is preserved unchanged as `archive/Notion-Original.zip`. Its SHA-256 appears in the import report. `archive/file-inventory.csv` accounts for every one of its 4,920 files; `archive/source-record-ledger.csv` lists every one of the 4,815 academy source pages and its destination or exclusion reason. All 11 academy CSV views were reconciled, not imported again as duplicate records. Tutorial pages, empty personal notebooks and Notion membership metadata are not operational users or trainees.

The original ZIP and ledgers are filesystem archives for the server owner, not public web resources. Academy source pages are available through the authenticated in-app archive. The source importer is included for reproducibility, not as a required first-run step. It refuses to overwrite an existing database and is a no-op when the same import is already recorded.

This package covers the supplied Notion export. Records or accounts added only to another running app copy are not silently merged or erased by it. Keep that separate copy until its contents have been checked.

## Verification and hosting

See `docs/TESTING.md` for the actual results and repeatable commands, and `docs/IMPORT_REPORT.md` for the complete 42-batch reconciliation. The imported edition passed source-field checks, application tests, actual HTTP/SSE/backup checks, and Chromium DOM workflow checks on isolated database copies. No production account or QA edits are packaged in the delivered database.

The browser environment blocked native URL navigation. Tests used the actual interface in an in-memory Chromium DOM connected to the real HTTP server; native hosted cookies, downloads, service-worker lifecycle and TLS remain host acceptance checks. No policy was changed. No formal security/accessibility certification, measured Lighthouse score or production load capacity is claimed.

The normal local runtime remains one persistent Node/SQLite service. A separate GitHub Pages + Supabase cloud adapter is included for authorized online deployment and does not alter the local mode; see `docs/CLOUD_DEPLOYMENT.md`. The Docker/Caddy deployment configuration is supplied but has not been run against a RED-controlled host. Backups, DNS, HTTPS, invitations and host administration still belong to your operator.

Optional external AI drafts are off by default and need server-side credentials, consent and review. Existing Notion reports are preserved without calling an external AI service. Built-in written summaries work without an AI account. No live provider call was used in verification.

## Project map

```text
public/                Authenticated app interface, modules, standalone Trainer Activities Studio, styles and icons
server/                API, validation, SQLite repository and schema
server.mjs             Persistent HTTP server and security headers
data/red-academy.db    Populated, account-free RED database
archive/               Original source ZIP and reconciliation ledgers (private)
scripts/               Read-only checks, backup, recovery and reproducible importer
supabase/              Private cloud schema, migrations and authenticated Edge Function
cloud/                 Non-secret cloud endpoint configuration
tests/                 Isolated Node, HTTP, DOM, field and workbook verification
docs/                  Import report, data rules, security, hosting and test evidence
types/                 Database-aligned TypeScript contracts
compose.yaml           Persistent data bind mount + HTTPS proxy template
START-WINDOWS.bat       Windows launcher
start.sh               macOS/Linux launcher
```
