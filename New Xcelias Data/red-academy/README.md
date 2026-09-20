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

## Records, persistence and safety

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
public/                Authenticated app interface, modules, styles and icons
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
