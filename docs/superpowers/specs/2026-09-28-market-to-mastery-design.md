# Market-to-Mastery: Product and System Design

**Status:** Local implementation in progress; not pushed or deployed
**Date:** 2026-09-28

## Decision summary

Build Market-to-Mastery as a connected workflow, not another listings site or standalone chatbot. An agent creates a concise brief from real Property Explorer projects; a buyer can inspect the evidence, understand trade-offs, and choose what to ask next. The same source-backed market observations can become trainer-reviewed practice in the existing Academy Studio.

The product's differentiator is the connection between market evidence, buyer understanding, and agent practice. AI may challenge the industry's habits of opaque recommendations and stale brochures. It must not bypass factual evidence, privacy, consent, or human judgment.

The system cannot guarantee that a public listing is accurate or available. It can guarantee that every displayed market claim has a known source, a capture time, an explicit data status, and no stronger wording than the evidence supports.

## User intent and constraints

- **Primary users:** Egypt-based property agents and buyers comparing residential projects.
- **Connected users:** trainers and trainees using current public market facts in the existing Academy Studio.
- **Success:** an agent can prepare/share a useful brief faster than manually assembling project details; a buyer can identify the source and date of a quoted starting figure and see material unknowns; a trainer can turn a reviewed market fact into a practice activity without receiving buyer data.
- **Constraints:** do not invent projects, prices, customers, source confirmations, legal status, availability, returns, usage metrics, or historical price changes. A source is not approved just because it is public or already appears in the Explorer catalog. Do not read or change Academy operational records for this module. Keep implementation local until Amr explicitly asks to push or deploy.
- **Privacy default:** buyer preference inputs stay in the buyer's browser. A share URL contains selected public project identifiers only, never buyer name, phone, income, budget, or private notes. Buyer sharing is explicit and revocable only if a later persistent-link service is approved; the MVP does not promise revocation for a stateless public URL.

## Existing product and market evidence

Property Explorer already has project discovery, map and filters, project comparison, price alerts, payment-plan fields, and RITA for buyer questions and agent coaching. Academy Studio already provides trainer-authored activities, assignments, learner links, and reviewable AI drafts. Market-to-Mastery should reuse these capabilities and join them through evidence, rather than add a competing chatbot, CRM, or training engine.

The repository audit on 2026-09-28 found 1,980 project records; 1,238 have `priceMeta.status === "verified"`, while 742 have no such current starting-price record. Of the 1,238 marked records, 708 have one source observation and 530 have two or more. Among those 530, 434 have source-observed values whose max/min spread exceeds 10%; the median spread is about 37.8%. This does not prove that a source is wrong: source pages can describe different unit types, phases, or offers. It does prove that a project match is not the same as price corroboration.

The current price summarizer picks the lowest matched source value as the project's `priceMin`. Its `confidence` is based on project-match score, not price agreement. The current RITA prompt and Explorer modal describe the aggregate as a “verified starting price.” The website README says 1,520 projects, so its count is stale against the current 1,980-record data file. The price status file calls its timestamp `lastPublishedAt`, and the updater writes that file only when project data changes; it therefore cannot represent the last successful source check when a run finds no changes. The monitor's state file retains quarantined pending changes but is not a historical price ledger.

The repository contains a legacy six-hour Nawy/RED collector and a daily Property Finder collector. Current Nawy, Property Finder, and Dubizzle terms restrict automated scraping and/or commercial aggregation without express authorization. The Property Finder partner network is an onboarding route, not permission implied by its public pages. Therefore Market-to-Mastery starts with agent-entered facts from documents/feeds Xcelias is authorized to use; no existing scraped catalog price is imported into a buyer brief and no new collector is enabled. The legacy workflow remains separate and has not been changed by this local module work. (Sources: [Nawy terms](https://www.nawy.com/terms), [Property Finder terms](https://www.propertyfinder.eg/en/terms-and-conditions.html), [Property Finder Developer Network](https://pfdn.propertyfinder.com/integration-guide), [Dubizzle Egypt terms](https://help.dubizzle.com.eg/hc/en-us/articles/4405534023823-What-are-Terms-of-Use), [official Egyptian property platform terms](https://realestate.gov.eg/en/terms-and-conditions).)

Source families to pursue, in order: (1) developer-issued price books/API access under written reuse/display terms; (2) licensed portal feeds/partnerships; (3) resale portals only via an approved commercial feed; (4) human-reviewed documents where Xcelias has permission; and (5) official registry/transaction evidence only for the exact fact that registry is authorized and able to attest. A resale listing is an asking price, not a completed transaction. WhatsApp is a delivery channel, not a license: no group scraping, joined-phone monitoring, or unapproved app integration. Manually transcribe only minimal price facts from a source the company may use; do not retain private group messages or other participants' personal data.

**Product implication:** do not compete on having another catalog, calculator, or chat window. Win by making a real property comparison traceable and useful in a buyer conversation, then turn its reviewed facts into better practice.

## Non-negotiable truth contract

### Observation, comparison, and freshness

1. A price is an observation from a named source, not an official or guaranteed market price. Store and display its amount, currency, project match, source listing ID when available, source URL, capture timestamp, and source-published timestamp only when the source actually provides one.
2. Keep source observations separate. Never average them or silently choose the lowest as a universally comparable price. If offers cannot be matched by unit type/phase/offer identity, label them as different source observations and explain that they may not be comparable.
3. Separate **project match confidence** from **price agreement**. Multiple matched sources do not imply agreement. A “sources aligned” state is allowed only when the offers are demonstrably comparable and within an explicitly tested tolerance; otherwise show “sources differ.”
4. Use explicit states: `observed—single source`, `observed—multiple sources differ`, `aligned comparable observations`, `change under review`, `stale`, and `no current source observation`. Preserve the prior observation when a new anomaly is quarantined, but visibly mark it stale or under review rather than imply it is current.
5. Record per-source check health on every scheduled attempt, including successful unchanged runs. Distinguish last attempted, last successful check, last observation, and last published data change. A failed source must never refresh a successful-check timestamp.
6. Begin history with a dated, source-linked launch baseline. Do not backfill or interpolate history unless repository/source records prove the exact prior observation and capture date.
7. A source-observed starting figure is never described as a unit quote, current availability, legal verification, investment return, or developer commitment. Buyers are prompted to confirm price, terms, and availability with the developer/agent.

### AI and learning

- Add an explicit **Deal Stress Test** action to the agent workflow, not another always-open chatbot. It flags source disagreement, stale facts, missing fields, and conflicts with the buyer's chosen priorities; it proposes questions to verify instead of choosing a property for the buyer.
- The AI receives only the selected public project observations and the agent's explicitly submitted, non-identifying criteria. The UI discloses the provider handoff before the first request and offers a no-AI path. No names, contact details, Academy records, learner answers, or actual buyer conversations are sent.
- Treat generated prose as an untrusted draft. Bind factual statements to supplied evidence IDs; validate citations against that request's evidence set; show the source beside each factual claim; label interpretation; require the agent to review before it appears in a downloaded or printed brief. The stateless public link contains only selected project IDs and current public catalog/source facts; it does not carry AI prose or agent notes. The model cannot fetch or update live prices.
- A trainer can turn a reviewed market observation into an explicitly labeled practice case in the existing Studio. The trainer reviews and publishes it. The link carries public fact context only. Existing Academy assignment rules remain in charge of learner access and scoring. No customer identity, preferences, or interaction history enters the training loop, and no new grade, attendance, or assessment records are created by this module.

## Proposed user journeys

### Agent prepares; buyer decides

1. From Property Explorer's existing compare flow or the Market-to-Mastery staff workspace, an authenticated agent selects up to three real projects. Selection is deterministic and visible; paid placement or hidden ranking is not part of the product.
2. The agent can enter non-identifying buyer priorities (such as areas, unit type, timing, or a budget band). Matching explains each fit and mismatch from actual available fields. Missing project data remains “not available”; the module does not claim a specific unit is in budget or available.
3. The brief shows separate source observations, source links, capture dates, source-health state, known payment/delivery fields, and missing facts. Agent-authored notes and AI interpretation, if included, are visually distinct from source data.
4. The agent shares a mobile-first, read-only buyer brief by link or QR. A public route is isolated from the private portal and exposes only selected public project data. It has no login, CRM lead form, visitor tracking, or AI endpoint in the first release. The buyer may explore criteria locally and contact the agent only through an explicitly supplied business contact action.
5. A static link resolves selected project IDs against the current public catalog. It does not freeze a historical quote. Each page load states when its source observations were captured. If a later release needs a frozen snapshot, revocation, or buyer/agent collaboration, that requires an explicit persistence, expiry, and privacy design rather than putting private data in a URL.

### Market fact becomes practice

1. The staff workspace shows new, changed, quarantined, stale, and missing source observations, with source-run health and links.
2. An agent or trainer opens a candidate observation and can copy/share its evidence or choose **Practice this fact**.
3. That action opens the existing Academy Studio's trainer-authenticated draft flow with the observation and citations prefilled. It is a draft, not an automatically published or assigned challenge.
4. The trainer checks the source and wording, then publishes/assigns using existing Studio controls. Learner results remain in Studio and are not used to alter buyer recommendations or train an AI model.

## System boundaries and rollout

Use the current repository's JavaScript, Express/static build, and portal auth. Do not add a second application stack or connect a new production database before its access and retention model is approved.

1. **Local evidence desk (implemented slice):** role-protected agent/admin workspace; agent can enter a permitted observation or import a daily CSV template. CSV rows are validated locally, deduplicated, staged as pending, and excluded from buyer briefs until a person reviews and approves the batch. The app checks format, not legal rights; the submitter must confirm permission and provide source context. Deterministic checks surface missing/comparable fields; no AI guesses, scraped catalog import, server persistence, or public link. Data stays in browser storage with explicit JSON backup and print-to-PDF sharing.
2. **Licensed source automation:** only after written rights and endpoint access exist, build adapters for source APIs/feeds. Each connector gets its own authorization record, permitted fields, attribution, quota, retention, error policy, and refresh cadence. Human review is required for uncertain project/unit matches and changes outside policy.
3. **Shared buyer briefs and Academy bridge:** only after approved source rights and a suitable persistence/revocation design. A public route must expose the minimum approved facts, never personal buyer information. Trainer handoff remains an Academy draft requiring trainer approval.

Each phase is independently testable. The local evidence desk does not claim live price monitoring. Do not promise hourly updates: choose a cadence per authorized source based on its update mechanism, contract limits, and actual change rate. The existing GitHub Actions job is a separate scheduled auto-commit path and remains unchanged/unpushed by this work; its sources require permission review before relying on it for this product.

## Security, failure behavior, and accessibility

- Staff APIs and screens verify the existing signed session server-side and use an explicit admin/agent role allowlist. Hiding a portal card is not authorization.
- The current buyer brief is an on-device print preview behind the authenticated staff workspace. Do not expose staff APIs, RITA proxy credentials, buyer criteria, portal cookies, or Academy data. User-entered source values and names must be escaped; only HTTPS links may open. The MVP has no unauthenticated buyer route.
- AI calls reuse the existing server-side Gemini proxy and rate limiting; never expose a key in browser code. No public unauthenticated AI endpoint is introduced.
- If source data is missing, stale, malformed, or unavailable, render the last known observation with its actual old timestamp and warning, or no price. Do not substitute a guessed value. If AI is unavailable or its citations do not validate, keep the deterministic brief working and omit the AI draft.
- Provide keyboard access, visible focus, screen-reader labels, responsive layouts, readable Arabic fonts/RTL, and reduced-motion support. Public and staff pages need distinct empty, stale, conflicting-source, loading, and error states.

## Verification and pilot criteria

Automated tests must cover source-run freshness on unchanged/failed runs, stable project mapping, same-source price-change history, quarantined anomalies, non-comparable source differences, legacy alert preservation without false triggers, public-route data minimization, session/role enforcement, HTTPS source allowlisting, AI evidence-ID validation, and trainer draft-only handoff. Existing Property Explorer search, compare, RITA, source-link, price-alert, and Academy Studio flows require regression coverage.

Before release, run the current build and test suites; inspect the approved full-screen visual concept against Browser/IAB desktop and mobile renders; verify English and Arabic, keyboard flow, public-vs-staff access, and one end-to-end path from real source observation to buyer brief and trainer draft. Do not use invented sample prices or fake usage analytics in production.

Pilot with willing agents and real buyers using public project facts. Measure agent time-to-brief, whether buyers can find the source/date and identify an unknown, and trainer adoption of reviewed market cases. Collect buyer feedback only with explicit consent and keep it separate from market data and Academy records. Decide expansion from observed use, not an assumption that all users will adopt it.

## Explicit non-goals

- A property listings marketplace, CRM, lead database, booking/payment product, mortgage approval, legal/title verification, or guaranteed investment advice.
- A second generic chatbot or replacement for RITA/Academy Studio.
- Automatic publication of AI prose, automatic learner grading, use of customer conversations as training data, or access to Academy operational records.
- New scraping sources, private WhatsApp group ingestion, a claim of official government verification, or reconstructed price history without evidence.
- Changes to live data, production secrets, DNS/subdomains, or deployment configuration during design review.

## Approval and next step

This document describes a locally implemented first slice and future gated phases. It does not authorize source agreements, external messages, changes to the legacy scheduled collector, production storage, pushing, or deployment. Any such action requires a separate explicit request.
