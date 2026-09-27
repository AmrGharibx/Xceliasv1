# RED Academy 3.0 / Verification record

Date: 17 September 2026. Tested runtime: Node.js 22.16.0 on Linux. Python 3.13.5 was used for optional field, workbook and Chromium DOM verification. Application runtime needs only Node; the QA tools are not runtime dependencies.

All write-based tests used disposable databases or isolated copies. The delivered database remains the original account-free import, not a test workspace. The exact supplied ZIP was used for source comparisons; no outside data was substituted.

| Verification | Passed |
| --- | ---: |
| Node calculations, validation, database, API, private access and imported-data regression tests | 144 |
| Actual HTTP, native SSE, persistence, backup and recovery baseline checks | 49 |
| Additional actual HTTP, source archive, imported edits and full backup restoration checks | 34 |
| Chromium DOM baseline workflow checks | 43 |
| Chromium DOM imported-workspace checks, including all 42 batch detail pages | 47 |
| Independent source comparison | 44,233 field assertions in 20 checks |
| Full workbook validation | 71,764 cells; all 2,805 formulas and cached results |
| Empty/native workbook regression checks | 21 |
| Non-overwriting / repeat-import safety checks | 5 |
| Untouched import baseline checks | 18 |
| JavaScript syntax | 31 files, no errors |

Current Academy Studio verification on 25 September 2026: `npm test` passed all 222 Node tests; `npm run check` parsed 78 JavaScript files with no syntax errors; `npm run cloud:build -- --check` passed; and the isolated `tests/trainer_activities_browser.py` Chromium flow completed successfully with no uncaught browser errors. This supplements the historical baseline table above; no live database or cloud migration was used.

## Reproducible checks

From the project root:

```sh
npm test
npm run check
npm run data:status
npm run verify:import
```

Before setup or changes, `node scripts/verify-import.mjs --baseline` additionally asserts the exact imported totals and zero packaged accounts/sessions/invitations/setup grants. Do not use baseline expectations as a reason to reset a working database after legitimate changes. Regular archive integrity verification does not require operational totals to stay fixed.

The imported fixture tests use an isolated copy of the database in this delivery. Their fixed baseline expectations are intended for the untouched package. Preserve an untouched reference package separately from the live working database.

```sh
node tests/live-http.mjs --results /tmp/red-http.json
node tests/live-import-http.mjs --results /tmp/red-import-http.json
python tests/notion_migration.py --source archive/Notion-Original.zip --results /tmp/red-fields.json
python tests/import_safety.py --results /tmp/red-import-safety.json
```

The field comparison verifies all original source hashes/text, every supplied attendance date/time/status/reason/late flag, all assessment inputs/comments/reports/totals, all independent checklist periods/flags/raw rollups, supplied/observed batch dates, relationship identities, 17+1 cross-batch masters, source exclusions and account-free integrity. Every academy CSV view was reconciled by the importer before committing the database.

The repeat-import test edits an isolated database and proves the same ZIP is a no-op rather than a reset. A different existing SQLite database is refused and stays byte-identical.

## Actual HTTP and recovery

Servers run as real Node subprocesses on loopback HTTP. Tests cover anonymous denials, closed signup, Origin/request-header checks, cookies, invitation identity/role tampering, viewer write denials, no-store and security headers, persistence, native SSE updates, deactivation, password recovery, online backups and restores.

Additional imported checks exercise the full 42-batch API snapshot, private source pagination and filters, original Markdown/hash retrieval, malformed-query rejection, partial-score edits with unchanged NULL values, source-review roles, retained original source contents, and a restored populated backup containing all source pages and subsequent working history.

HTTPS-mode cookie/header behavior was checked through loopback proxy simulation. This is not evidence of a live public certificate or a hosted browser session.

## Role-play AI co-planner checks

The role-play draft API requires explicit consent, a known learning focus, bounded lesson notes, and rejects likely email/phone contact details before provider access. Provider output is validated for three client turns and three distinct observable coaching moves; malformed or identifying output is rejected. Tests verify the Gemini request contains only the chosen skill and consented lesson brief (never roster, assessment, attendance, score, or XP data), draft generation does not change Academy state, and a separate six-drafts-per-hour limit applies. The isolated Chromium acceptance mocks Gemini, proves no request is made before consent, then exercises the temporary scene through all three turns, trainer-only context, coaching lens, move celebration, retry-compatible scene cycling, and close/reopen cleanup. It uses no real provider credential or network request.

## Browser DOM acceptance

Live-room API coverage checks two-, three-, and four-team rosters, rejects joining a team that a room does not contain, and preserves the legacy two-team request format. Browser acceptance joins a phone to team four and verifies its place on the host board before and after room recovery. A dedicated SQLite upgrade test starts from the old two-team constraint and proves saved player points, answers, and foreign keys survive the schema upgrade.

Academy Studio learner acceptance includes the private active-recall warm-up: mark a card for one second look, carry unresolved focus topics into the pre-quiz recap, restart the cards, and jump to the quiz. It verifies that the self-ratings remain ungraded and do not enter the trainee result.

Custom challenge tests validate authoring limits and skill tags, verify that learner/library responses omit correct choices and coaching answers, run a trainer-made quiz through private issue/open/grade/reopen, confirm its result contributes to private skill insights, host the same challenge in a live multi-team room, then archive it and verify new use stops while saved learner and room history remains usable. Cloud support additionally requires migration `20260924200000_studio_custom_challenges.sql`; tests and cloud builds do not apply it.

The optional AI co-designer reuses the Gemini integration and requires explicit consent. API tests prove likely contact details are rejected, no roster information is sent, output must pass the same server-side challenge validator, no data is saved, and the separate six-drafts-per-hour limit is enforced. Chromium tests mock the provider and verify the consent gate, exact-round editable draft insertion, recall-card insertion, manual edits, and publication through the existing secure quiz flow. No real provider credential or request is used in tests.

```sh
python tests/browser_dom.py --results /tmp/red-browser.json
python tests/browser_import.py --results /tmp/red-import-browser.json --screenshots /tmp/red-previews
python tests/trainer_activities_browser.py
```

These optional tools require Python Playwright and Chromium; set CHROMIUM_PATH when necessary. Native browser URL navigation was blocked by the verification environment's managed policy. No browser policy was changed or bypassed. The exact UI modules/styles were mounted into an in-memory Chromium DOM with a fetch bridge to the real private server. EventSource notification in that DOM was simulated; native SSE was independently tested over actual HTTP.

The standalone Trainer Activities Studio browser test starts its own temporary SQLite-backed server, creates disposable QA records, signs in a test trainer, and verifies that facilitator answer keys are restricted to writable staff. It confirms all eight curated challenges render and each offers direct assignment/live launch with the challenge preselected. It verifies a future session displays the quiz unlock date, the API rejects an early attempt, and a current-day session opens the linked challenge prefilled for the right batch, company, active roster, and due date; private trainee links are prepared automatically, while attendance and formal assessment records stay unchanged. It confirms the shared board stores the assignment relationship, rejects duplicates, and lets another trainer open the same live completion card. A separate API race check sends two trainer assignments simultaneously and proves exactly one wins. It exercises the original spoken team-room controls, then uses a separate unauthenticated Chromium context as a learner phone: join code, team/nickname join, private answer changes, synchronized timer, withheld answer key, reveal/coaching feedback, live scoring/streak bonus, leaderboard, trainer-page reload and room recovery, rotated join code, learner seat-token reconnect, replay reset and trainer shutdown. It also runs a session-step Class Pulse from three separate phone contexts, checks name/team-free joining, the three-response aggregation threshold, withheld learner distribution before reveal, ungraded synchronized results, return to the same facilitator step, and unchanged Academy records. Session planning validates and persists trainer-edited facilitator prompts; AI prompt drafting requires consent, rejects contact details, excludes trainee data and answer keys, returns exactly four validated cues, and saves nothing until the trainer submits the reviewed session. It then assigns native challenges and follows private trainee links through study cards, hint use, quiz submissions, learner skill signals, private staff practice recommendations, targeted one-trainee assignment, saved-result replay, achievements, accumulated XP and level progression. It also checks narrow-screen overflow and uncaught browser errors. The temporary database is deleted when the test exits; no packaged or live RED database is used.

The same acceptance flow tests the optional Second Chance study loop after a missed round: delayed answer reveal until active recall, one learner-selected second look, phone-width layout, a private completion recap, reopening the saved result, and equality of the Academy batch, trainee, assessment, and attendance records before and after practice. The trainer XP total must also remain unchanged. Optional confidence ratings are checked against a mixed quiz result and the exact submit payload is inspected to confirm they never leave the browser; reopening a result must not restore those transient ratings. A separate interruption check answers a round, advances, refreshes the private link, resumes at the saved round, and verifies both the earlier choice and hint are restored; API checks ensure drafts stay out of staff records and are cleared from the learner link after submission.

The imported suite opens all 42 batch details and eleven desktop/mobile routes. It verifies complete registers, unknown-status board lane, missing-date timeline handling, both Batch 30 checklist periods, all Batch 43 attendance, the one partial unassigned Batch 42 entry, correct unrecorded headcount, shared assessments, blank-skill saves, preservation of conflicting times during note edits, unassigned assessment history, undated batch editing, original source inspection and administrator review acknowledgement. The 390-pixel mobile views fit without document-width overflow. No uncaught application JavaScript errors occurred.

Screenshots are actual Chromium renders of the imported app on an isolated QA database. The QA owner is not an account in the delivered database. Native hosted navigation, cookie enforcement, actual downloads/print, service-worker lifecycle and TLS remain acceptance checks on the real host.

Academy Studio's regression suite also verifies the Classroom Pulse: completed graded attempts are aggregated by selected batch/company, names and raw answers are omitted, first-to-latest skill movement is calculated per repeat learner before aggregation, low-volume patterns are labelled as early signals, and the recommended next challenge opens preselected for either live play or private assignment.

Session-board API tests verify unauthenticated/invalid sessions return 401, viewers cannot read or change the trainer-only plans, invalid batch/company/date/challenge scopes are rejected, plans are visible to a second trainer, step progress is audited and version-checked, and completion can be reopened. The isolated Chromium test creates a batch/company plan, completes a step, reloads the page to prove persistence, checks phone-width layout, and launches the linked challenge. Local SQLite reaches schema version 15. Cloud persistence uses additive migrations; apply `supabase/migrations/20260924220000_activity_session_plans.sql` after the custom-challenge migration, then the learner-draft migration, `supabase/migrations/20260925200000_activity_session_quiz_link.sql` for the one-to-one quiz link, and finally `supabase/migrations/20260925220000_activity_live_confidence.sql`. No cloud migration is run by tests or builds.

## Sequence Sprint

The live-only Sequence Sprint deck is checked for six unique order encodings, five complete client-care rounds, authored correct sequences, and strict separation from the public graded challenge library. API tests create a phone room, assert that the host and player receive only the scrambled steps before reveal (not the scoring slots or key), submit an order, verify points are awarded only on reveal, and confirm batch, trainee, assessment and attendance data remain byte-for-byte unchanged. The isolated Chromium acceptance moves three steps on a separate phone viewport, verifies the order submission remains private, reveals the coaching order and temporary points, checks for no horizontal overflow, and confirms no Academy records or assignment rows changed. Live Debrief Lens unit and browser checks cover unrevealed/empty rooms, small-room handling without a percentage, calibrated three-plus response coaching, and the explicit non-grade notice. Live confidence tests cover optional selection, answer restoration, strict enum validation, Pulse exclusion, no pre-reveal host disclosure, privacy-thresholded aggregate accuracy, and unchanged Academy records; existing local answers migrate with a null confidence value. Cloud support adds `supabase/migrations/20260925220000_activity_live_confidence.sql` after the session-quiz-link migration. No cloud migration is run by tests or builds.

## Full Excel export

```sh
node tests/export-files.mjs /tmp/red-native-export
python tests/verify-exports.py /tmp/red-native-export
node tests/export-imported.mjs /tmp/red-import-export
python tests/verify-imported-export.py /tmp/red-import-export
```

Workbook reading requires optional openpyxl. Each command needs a new output directory. It does not modify the operational database. Every generated cell and all 2,805 formula/cached pairs were checked. Technical/soft/overall percentages were also independently recomputed from the four source inputs; checklist completion was independently counted from its flags. All 77 unavailable formula results stayed blank, not zero. No cached error cells were present. Original text beginning with a formula-like prefix stays literal text.

The seven full-import sheets contained 42 batches, 903 roster entries, 2,606 daily records, 264 checklists, 847 assessments and 55 companies, plus the overview sheet. The checked workbook was a QA export, not a substitute for the SQLite database.

## Release boundaries

The Docker/Compose/Caddy configuration was not executed on a RED host. No RED domain, server, staff account or live AI provider was configured. The app does not claim enterprise SSO/MFA, per-company tenant isolation, application-level encryption at rest, formal WCAG conformance, a penetration-test certification, measured Lighthouse targets or a production load limit.

Use the real deployment acceptance checklist in DEPLOYMENT.md before giving staff shared HTTPS access. Keep private exports/backups/source files off public hosting. The machine-readable results in this directory's verification subfolder omit temporary setup tokens, passwords and test-server logs.
