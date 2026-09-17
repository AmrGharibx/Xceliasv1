# RED Academy / Access and operational security

## Boundary

One deployment is one private RED workspace. Only a configured administrator and accounts activated through administrator-generated invitations can access the records. The public login shell and its code contain no operational data. API authorization, not a hidden button or client-selected role, is the access boundary.

All authorized roles can read the shared records across companies. Company filters do not implement separate tenants. Read access lets a person copy data they can see; hiding export buttons from viewers does not prevent this. Do not invite external partners who should see only their own company's rows.

## Accounts and invitations

First-owner setup requires a 32-byte random, URL-safe code printed in the server terminal. Only its SHA-256 hash is stored. It expires after 24 hours and is consumed by the first successful setup. Unconfigured-server restarts replace the code; a configured server never creates another first owner. Protect logs and host access.

Passwords use Node scrypt with independent salts and timing-safe comparison. There are no shared or hardcoded production credentials. Twelve-hour session cookies contain opaque random tokens; the database stores hashes. Cookies are HttpOnly and SameSite=Lax, with Secure enabled for an HTTPS APP_URL or production mode. Production refuses an HTTP APP_URL; a TLS proxy must actually provide HTTPS.

Invitations are generated only by administrators, expire after 48 hours, and are single-use. Their tokens are stored hashed; only the creation response contains the usable link. Recipient name, email, and role come from the stored invitation. Reissuing an invitation invalidates the old pending link. Administrators can revoke pending invitations.

**An invitation is a bearer secret, not independent mailbox verification.** Anyone possessing an unused link could activate its account. Deliver it through a trusted private channel to the intended staff member. The application does not send verification emails or prove domain employment. There is no public account registration.

Password changes and maintenance resets revoke that user's sessions. Role/activation updates revoke the affected sessions; the final active administrator cannot be demoted or deactivated. Sign-out clears the browser's loaded state immediately. A disconnected sign-out leaves a non-sensitive pending flag and retries server revocation on reconnection; it does not falsely claim the unreachable server was already notified.

## Request and storage protections

Writes require the exact configured Origin and the custom X-Red-Request header. Cross-origin access is not enabled. Session and role checks run on protected API requests. Request sizes, entity names, allowed fields, score ranges, date schedules, references, and versions are validated. SQL values are parameterized; write batches run in transactions. Foreign keys and unique constraints preserve relationships.

The static host exposes only the public directory. Dotfiles and private database/source paths are blocked. Responses include frame denial, nosniff, no-indexing and permissions headers; HTML has a self-only script CSP. Application documents, scripts, styles and API snapshots are no-store. The service worker does not cache application responses; activation removes only legacy RED Academy caches.

Operational records remain in memory while signed in, not browser LocalStorage or a browser database. Old RED demo keys on the same origin are removed. Browser/device compromise, extensions, screenshots, downloaded reports, and other origins' stored files remain outside this application's control.

SQLite is not encrypted at rest by this code. Use protected disks, backups, host access, and service-account permissions. POSIX directory/database/backup permissions are restricted where the code creates them; Windows administrators must configure suitable NTFS access controls. Backups contain password hashes and may include sessions; keep them private.

## Exposure and abuse

Application counters throttle login, setup, invitation activation, password changes, and external AI calls. They are not a replacement for network/edge abuse controls, monitoring, or denial-of-service protection. Keep database and reverse-proxy administration off the public internet. An IP/VPN allowlist can add a perimeter restriction without replacing account authorization.

The supplied application has no analytics beacon or remote UI dependency. Optional external report generation is off by default and requires server secrets, consent and review. Removing direct identifiers is not a guarantee that the remaining metrics cannot identify someone. RED must approve the provider and its data handling before enabling the feature.

CSV exports neutralize formula-leading user strings; XLSX writes user strings literally and inserts only known application formulas. UI text is escaped. Exports are not encrypted and remain the responsibility of authorized recipients.

## History, retention and backups

Normal deletion of batches/trainees removes their current linked records but intentionally retains original Notion source pages, original relations, assessment revision snapshots and audit metadata. It is not a complete historical erasure. Define a retention and incident-response procedure suited to RED's requirements for the imported historical data and before collecting additional personal information.

Keep protected, off-server backups and test restoration. JSON exports are loaded snapshots, not complete database backups. A restored database can restore old sessions; invalidate those sessions before reopening access. Use one persistent server instance; do not mount the same SQLite file across unrelated application replicas or rely on an ephemeral filesystem.

## Verification limits

No independent penetration test, security certification, production load test, formal WCAG audit, enterprise SSO, application MFA, email-password recovery, tenant isolation, file uploads, or field-level access control is claimed. Review security for the intended staff count, infrastructure and data sensitivity before external exposure. The Docker/TLS template has not been run on a RED-controlled host.

The private source ZIP, source ledger and imported SQLite file contain personal/performance information. They are excluded from Git and image builds, but they remain in this delivery for the authorized server owner. Do not publish the delivery archive. All logged-in roles can read the academy source archive; membership must reflect that access.
