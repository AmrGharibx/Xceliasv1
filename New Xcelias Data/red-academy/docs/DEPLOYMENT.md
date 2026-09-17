# RED Academy / Deployment and recovery

## Choose the operating environment

For setup on one computer, run `npm start` and keep `HOST=127.0.0.1` and `APP_URL=http://localhost:3000`. Only that computer can connect. This is the working application with a persistent database, not a demo.

For the RED team, use one always-on server with persistent disk and a domain RED controls. Staff browsers must be able to reach its HTTPS address. The host needs Node 22.16+ or Docker Compose. Apply supported runtime/OS updates, restrict host administration, and plan backups and access monitoring. This application is not configured for static hosting, Vercel's ephemeral filesystem, or multiple SQLite replicas.

## Included Docker + HTTPS template

The following configuration is supplied, but was not executed in this environment because Docker and a RED domain/certificate endpoint were not available. Validate it on your server before allowing staff access. This release already contains real trainee records; protect the source directory throughout setup. It builds the same Node application that passed the local tests, not a different cloud adapter.

Point the chosen domain's DNS to your server. Make ports 80/443 reach the Caddy proxy; do not expose port 3000 or database files. Review any firewall, access proxy or VPN rules your RED team requires.

Copy `.env.deploy.example` to `.env.deploy` and replace the example with a real hostname you control:

```dotenv
ACADEMY_DOMAIN=academy.your-red-domain.example
```

This is an example, not a supplied or verified RED domain. Use a hostname only: no scheme, slash, wildcard, or port. On the server, run:

```sh
test -s data/red-academy.db
mkdir -p backups
# On Linux: permit the node service account in the container to access its data.
sudo chown -R 1000:1000 data backups
sudo chmod 700 data backups
sudo chmod 600 data/red-academy.db
docker compose --env-file .env.deploy config
docker compose --env-file .env.deploy up -d --build
docker compose --env-file .env.deploy logs academy
```

The academy service listens internally; only Caddy publishes network ports. The `./data` and `./backups` bind mounts retain the populated database and backups outside the image. Caddy uses named volumes for certificates/configuration. **An empty or missing data mount would create a new empty workspace: verify the supplied `data/red-academy.db` exists before starting.** No database is copied into the image because `.dockerignore` excludes private data and archives. Caddy uses the configured domain for HTTPS and streams SSE updates from the application. Certificate issuance depends on your DNS and network configuration, not this ZIP.

The first academy logs contain the one-time owner setup code. Open the configured HTTPS address, enter the code, choose the RED administrator's credentials, and then sign in. Keep logs private. After setup, test access and invite only authorized RED staff.

The production app requires an HTTPS APP_URL and sets Secure cookies. Connecting directly to its internal HTTP port is not a supported user login path. If using your own TLS proxy instead of Caddy, preserve Origin/Host, forward `/api/events` without buffering, set appropriate timeouts, and verify cookie/session behavior from the real browser origin.

Do not delete or replace the working `data` bind-mount directory during code updates. Do not copy the original imported database over a database that has subsequent records/accounts. Avoid `docker compose down -v`: it removes the proxy certificate volumes. Preserve and back up the bind-mounted data separately.

The image tags follow maintained major-version channels rather than an audited pinned digest. Your release operator should validate the selected images and pin reviewed digests for controlled rollouts. The container and HTTPS stack are not covered by the local runtime test results.

## Database backup

For direct Node hosting, use `npm run backup`. For the supplied Compose service:

```sh
docker compose --env-file .env.deploy exec academy node scripts/backup.mjs /app/backups/red-academy-safe-copy.db
```

Choose a new filename each time. The command refuses to overwrite an existing file. Copy the completed snapshot to a protected off-server location; a backup volume on the same machine is not sufficient disaster protection.

For example, copy that specific backup out with:

```sh
docker compose --env-file .env.deploy cp academy:/app/backups/red-academy-safe-copy.db ./red-academy-safe-copy.db
```

Encrypt and restrict the copied file. No automation or remote backup account is configured by this release. Choose a cadence and retention period for RED and test it operationally.

## Restoring safely

Stop the application before replacing its database. Preserve the current database and its matching `-wal`/`-shm` files together for rollback. Use a new directory for the restored copy so old journal sidecars cannot be accidentally mixed with it. Set DATABASE_PATH to the restored file and verify file permissions.

Before starting the restored service, invalidate sessions in that restored copy. With `DATABASE_PATH` pointing to the intended restored file, run this from the project root:

```sh
node --input-type=module -e "import {loadEnv} from './server/env.mjs'; import {DatabaseSync} from 'node:sqlite'; loadEnv(); const db=new DatabaseSync(process.env.DATABASE_PATH||'./data/red-academy.db'); db.exec('DELETE FROM sessions'); db.close();"
```

This deliberately signs everyone out of the restored database; it does not remove their accounts or training records. Do not run it against another instance by mistake. For Docker restoration, mount the restored volume into a maintenance container, run the same operation there, and verify ownership before restarting the academy service.

Start the restored application on an isolated address first. Run `npm run data:status`, check the integrity result, sign in, and confirm known records and roles. A restore drill using a disposable real backup passed the included live HTTP tests. The operator still needs to test their own storage and recovery procedure.

## Recovering an administrator password

A server operator can set RESET_EMAIL and RESET_PASSWORD in a temporary process environment and run `npm run reset:password`. The command preserves role and activation state and revokes that account's sessions. Remove the secret from the environment afterward. Do not store it in `.env`, source control, or shared shell history. Only a trusted operator with database access should do this.

## Before opening to staff

From the actual HTTPS URL, verify first setup can no longer be used; an anonymous window cannot fetch workspace records; an invited member can activate once; a viewer cannot write or invite; deactivation invalidates an existing session; a password change signs out existing sessions; two staff browsers receive saved attendance updates; restarts preserve data; backups restore; and desktop/mobile browsers display the controls without clipping.

Check that TLS is valid, all direct API paths enforce authentication, business data is not cached offline, invitation URLs use the chosen domain, browser developer consoles contain no application errors, and downloaded reports contain only intended records. Check the old demo URL or deployment has been retired separately. No live server was updated by generating this release.

Before first setup, `node scripts/verify-import.mjs --baseline` verifies the account-free 42-batch imported baseline. After setup or edits use `npm run verify:import` without `--baseline`. Do not run a source re-import as a routine update. Keep the original package as a protected offline reference, not as a replacement for live backups.
