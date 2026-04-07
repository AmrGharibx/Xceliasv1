# Property Explorer Audit Report

Date: 2026-04-06
Workspace: j:\Excelias V2
Primary app: Website ( WorkSpace ) served through excelias-portal on http://localhost:4000/website/

## Scope

This audit covered the live Property Explorer runtime, the portal serving layer, the production build pipeline, and deployment header parity.

## Completed Phases

### 1. Runtime Stabilization

- Fixed boot and CSP-related failures that could leave the app uninitialized.
- Removed the road-overlay dependency on osmtogeojson from unpkg and replaced it with a native Overpass JSON to GeoJSON path.
- Fixed portal CSP allowances needed for ArcGIS imagery and blob-backed imagery rendering.

### 2. Core Interaction Audit

- Validated and repaired search, filters, route planning, route tour flows, modal flows, comparison flows, favorites, price alerts, language switching, theme flows, and mobile navigation behavior.
- Fixed stale advanced-filter active-count behavior.
- Fixed dock group accessibility state synchronization.
- Fixed overlay state synchronization across class, hidden, inert, and aria-hidden.

### 3. Export and Asset Hardening

- Fixed brochure QR generation by shipping a local qrcode.js asset instead of loading from node_modules at runtime.
- Externalized inline website GSAP and service-worker bootstraps into shipped assets for CSP-safe serving.
- Rebuilt dist and confirmed shipped website assets return HTTP 200 from the served build.

### 4. Voice UX and Logic Validation

- Fixed denied-permission UX so search voice shows a user-facing placeholder error and AI voice posts a visible bot guidance message.
- Validated the search voice success path with a fake SpeechRecognition implementation.
- Validated the AI voice success path with a fake SpeechRecognition implementation, including transcript submission and bot reply generation.

### 5. Portal and Deployment Parity

- Fixed a real configuration bug where Permissions-Policy blocked microphone access before app logic could run.
- Updated local server policy in excelias-portal/server.js.
- Updated deployment parity in vercel.json.
- Added regression coverage in excelias-portal/**tests**/server.test.js.
- Re-ran tests successfully: 49/49 passed.
- Rebuilt dist successfully and verified the portal is serving from dist.

## Partially Completed Phase

### Real Device Microphone Validation

The app-side microphone and speech-recognition paths are validated, but a true real-device pass remains partial because the active browser session still reports microphone permission as denied.

Observed state on the rebuilt live page:

- Permissions-Policy served correctly as `camera=(), microphone=(self), geolocation=(self)`.
- `navigator.permissions.query({ name: 'microphone' })` returns `denied`.
- `navigator.mediaDevices.getUserMedia({ audio: true })` fails with `NotAllowedError: Permission denied`.
- Playwright `page.context().grantPermissions(['microphone'])` cannot help in this environment because the integrated browser protocol does not implement `Browser.grantPermissions`.
- `page.context().clearPermissions()` and CDP `Browser.resetPermissions` were both attempted, but the page still returned `denied`.
- CDP `Browser.setPermission` is also unavailable in this environment.

This indicates the remaining blocker is the browser session's stored permission state, not a website, portal, CSP, build, or deployment regression.

## Remaining Work

### 1. One Real Microphone Pass

Run one manual microphone-backed search and AI voice pass in a browser session that can actually prompt for or persist microphone access for http://localhost:4000. In the current VS Code integrated browser session, the permission is hard-denied and the normal automation grant APIs are unavailable.

### 2. Optional Formal Closeout

If needed, convert this audit into a shorter release or PR summary.

## Verification Evidence

- Portal test suite passed after the microphone policy fix.
- Production build completed successfully via build.js.
- Rebuilt served assets verified from /website/:
  - qrcode.js
  - website-gsap.js
  - website-sw.js
- Search voice on the served build populated `villas in sahel` and updated visible browse results.
- AI voice on the served build submitted `عايز شاليه على البحر` and received a bot response under the synthetic recognizer path.

## Key Files Touched During Audit

- Website ( WorkSpace )/app.js
- Website ( WorkSpace )/index.html
- Website ( WorkSpace )/qrcode.js
- Website ( WorkSpace )/website-gsap.js
- Website ( WorkSpace )/website-sw.js
- build.js
- excelias-portal/server.js
- excelias-portal/**tests**/server.test.js
- vercel.json

## Final Status

All meaningful app-side, build-side, and deployment-side audit phases are complete. The only unresolved item is an environment-level browser permission denial in the current integrated browser session, preventing one final real-device microphone confirmation despite the app, headers, tests, and served build all being in the correct state.
