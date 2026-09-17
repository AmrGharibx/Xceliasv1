# RED Academy / Start the imported workspace

**All real Notion data is already loaded. There is no import step to perform.**

Extract **RED-Academy-With-Notion-Data.zip** into a new folder. Keep the previous app/database as a backup; do not copy its `data` folder or `.env` over this release.

Stop any older RED Academy server using port 3000 before launching this copy.

With **Node.js 22.16 or newer** installed, double-click **START-WINDOWS.bat** inside `red-academy`. Or open a terminal there and run:

```sh
npm start
```

Open **http://localhost:3000**. Keep the terminal running.

Enter the one-time setup code printed in the terminal. Choose your administrator name, work email and password, then sign in. The database has **42 batches, 903 enrollment/profile rows, 2,606 daily records, 264 checklists, 847 assessments and 55 companies**. It contains no default account, password or imported Notion login.

Start with **Batches** to browse each roster and its linked records. Open **Notion import & review** for the reconciliation, original source pages and retained discrepancies. Missing records are intentional gaps, not automatic absences or failures. Demo Batches 44-57 are excluded from the operational academy. Batch 25 is absent from the export.

To invite RED staff, use **Workspace settings -> Manage team -> Invite team member**. Send the generated one-use, 48-hour link privately. No email is sent automatically. A localhost link works only on the server computer; colleagues on other computers need the shared HTTPS hosting described in `docs/DEPLOYMENT.md`.

Before first setup, these read-only commands confirm the delivered data:

```sh
npm run data:status
node scripts/verify-import.mjs --baseline
```

The result must show **42 batches**, not an empty workspace. During normal use, check integrity with `npm run verify:import` and create protected database backups with `npm run backup`.

**Keep this package private.** It contains real trainee and performance information, including the original Notion ZIP under `archive/`. Do not publish it as a static site or public repository. A code update must never overwrite the working database with the original imported copy.

No live RED domain/server was changed. The included local application is the verified operating edition; HTTPS hosting still requires your server configuration and browser acceptance checks. Detailed data rules, test results and the batch-by-batch report are included in `docs/`.
