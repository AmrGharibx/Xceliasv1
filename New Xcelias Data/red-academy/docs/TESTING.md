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

## Browser DOM acceptance

```sh
python tests/browser_dom.py --results /tmp/red-browser.json
python tests/browser_import.py --results /tmp/red-import-browser.json --screenshots /tmp/red-previews
```

These optional tools require Python Playwright and Chromium; set CHROMIUM_PATH when necessary. Native browser URL navigation was blocked by the verification environment's managed policy. No browser policy was changed or bypassed. The exact UI modules/styles were mounted into an in-memory Chromium DOM with a fetch bridge to the real private server. EventSource notification in that DOM was simulated; native SSE was independently tested over actual HTTP.

The imported suite opens all 42 batch details and eleven desktop/mobile routes. It verifies complete registers, unknown-status board lane, missing-date timeline handling, both Batch 30 checklist periods, all Batch 43 attendance, the one partial unassigned Batch 42 entry, correct unrecorded headcount, shared assessments, blank-skill saves, preservation of conflicting times during note edits, unassigned assessment history, undated batch editing, original source inspection and administrator review acknowledgement. The 390-pixel mobile views fit without document-width overflow. No uncaught application JavaScript errors occurred.

Screenshots are actual Chromium renders of the imported app on an isolated QA database. The QA owner is not an account in the delivered database. Native hosted navigation, cookie enforcement, actual downloads/print, service-worker lifecycle and TLS remain acceptance checks on the real host.

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
