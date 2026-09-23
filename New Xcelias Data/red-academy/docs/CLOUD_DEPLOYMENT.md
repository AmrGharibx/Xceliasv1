# RED Academy cloud deployment

## What this path provides

The cloud path keeps the existing local Node/SQLite application intact and adds
an online deployment path for the same RED Academy interface:

- GitHub Pages hosts only the static application shell. It never receives the
  SQLite database, backups, source archive, portraits, or a data snapshot.
- A Supabase Edge Function performs all authenticated reads and writes using a
  server-side service key. The browser receives only a short-lived opaque
  session token and keeps it in session storage.
- Every private application table has RLS enabled and is denied to browser
  database roles. The only public realtime object is an increasing revision
  number with no trainee, assessment, account, or company data.
- When one authorized staff member saves a record, a Supabase Realtime signal
  makes other signed-in browsers refresh immediately. A protected fallback
  checks every minute after a dropped websocket and every five minutes while
  the websocket is healthy, avoiding excessive function polling.
- The existing Report Generation 3 module is not changed.

The browser configuration contains the Supabase project URL and a publishable
key only. Those values are designed to be public. Do not put a service-role
key, OpenAI or Gemini key, password, database file, or source archive in Git,
Pages, or cloud/production.json.

## One-time production setup

This needs an authorized Supabase project administrator because the project
does not exist in this workspace and cloud-account sessions are not stored in
source control.

1. Create a new, empty Supabase project for RED Academy. Do not use an existing
   project containing unrelated data.
2. From this folder, link the Supabase CLI to that project, then apply the
   migrations and Edge Function:

       npx supabase login
       npx supabase link --project-ref YOUR_PROJECT_REF
       npx supabase db push
       npx supabase functions deploy academy --no-verify-jwt

3. In the Function secrets, set these exact values:

       SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
       ACADEMY_SUPABASE_SECRET_KEY=<secret key>
       ACADEMY_ALLOWED_ORIGINS=https://YOUR_GITHUB_OWNER.github.io
       ACADEMY_APP_URL=https://YOUR_GITHUB_OWNER.github.io/Xceliasv1

   ACADEMY_ALLOWED_ORIGINS is the origin only; it has no repository path.
   ACADEMY_APP_URL is the full GitHub Pages address and is used only when
   creating invitation links. Optional AI reports additionally require the
   existing server-side AI settings; they remain off unless explicitly set.
   Instructor-comment polishing uses the same Gemini key as Report Generation
   3: set `AI_REPORTS_ENABLED=true` and `GEMINI_API_KEY` as Supabase Function
   secrets. Never put the Gemini key in the browser, cloud configuration, or Git.
   Current Supabase Functions also expose their default secret key automatically;
   ACADEMY_SUPABASE_SECRET_KEY is an explicit fallback. A legacy project can
   use SUPABASE_SERVICE_ROLE_KEY instead; the application supports that older
   JWT key only on the server side.

   The current production workspace is served from
   `https://xcelias.com/red-academy`. Its function allow-list includes both
   `https://xcelias.com` and the existing GitHub Pages origin, while
   `ACADEMY_APP_URL` is `https://xcelias.com/red-academy`. Keep both origins
   during the transition so existing Pages links continue to work; do not add a
   path to `ACADEMY_ALLOWED_ORIGINS`.

4. In one temporary shell only, set SUPABASE_URL and SUPABASE_SECRET_KEY, then
   run:

       npm run cloud:migrate

   The command first makes a protected SQLite snapshot, refuses a non-empty
   target by default, transfers verified records and accounts, invalidates all
   cloud sessions, and verifies remote counts. It intentionally stops if the
   local database contains portraits so those files can be reviewed and moved
   privately rather than silently exposed.

5. Put only these non-secret values in cloud/production.json:

       {
         "apiUrl": "https://YOUR_PROJECT_REF.supabase.co/functions/v1/academy",
         "supabaseUrl": "https://YOUR_PROJECT_REF.supabase.co",
         "publishableKey": "YOUR_SUPABASE_PUBLISHABLE_KEY"
       }

6. Push the repository's main branch. The included GitHub Actions workflow
   validates the configuration, builds a static-only cloud-dist folder, and
   deploys it to GitHub Pages. Until all three values are valid, the workflow
   deliberately completes without publishing a broken login page.

## Operational checks

After the first deployment, sign in as two separate users in two browser
profiles. Change a trainee assessment in one profile and confirm the other
refreshes promptly. Confirm an unauthenticated request to the Edge Function
cannot fetch /state, and confirm GitHub Pages contains no data, archive, or
backup files.

Use the Supabase dashboard to monitor database size, storage, function errors,
and project status. The supplied data fits the current free database allowance,
but free Supabase projects can pause after inactivity and have no production
SLA. There is no compliant code workaround for that provider policy; a paused
project must be resumed by its authorized account owner. Maintain an offline
SQLite backup before migration and a protected cloud backup afterward.
