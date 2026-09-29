# Market-to-Mastery: source access and price-truth policy

**Status:** implementation guidance; no source partnership or permission is asserted.
**Reviewed:** 2026-09-29

## Decision

Market-to-Mastery must be source-rich, not scrape-heavy. A public URL, a logged-in account, a joined WhatsApp group, or a phone number receiving messages is not a license to build and republish a commercial property-price database.

The first local release therefore accepts source facts that an agent confirms Xcelias may use, stores them only in that agent's browser, and can print a deliberately reviewed buyer brief. It does not automatically fetch a portal, read WhatsApp, publish a public share link, or send data to an AI service. Those capabilities need written source rights and a shared-store design first.

## What can count as a price fact

Keep these as distinct observation types. Never average them into a single “market price.”

| Fact type | What it means | What it does not establish |
| --- | --- | --- |
| Developer launch / primary offer | A dated offer or price book supplied by the developer or its authorized sales channel | That a specific unit is still available or that the amount is a final quote |
| Resale asking price | A seller/agent's current advertised request | A completed sale, accepted offer, or market-clearing value |
| Completed transaction evidence | A documented completed sale, with permission to use and enough detail to match the unit | A price for other units or phases |
| Rental asking price | A current advertised rental request | A signed lease or realized rent |
| Valuation / estimate | A professional or model-based assessment | A transaction record or developer commitment |

For every observation, capture: project and developer identity; source owner and source record/document reference; source class; amount and currency; capture time; source publication/effective date only if printed or returned by the source; offer type; unit type, size, finishing, phase, delivery and payment terms where known; source URL where safe; rights/permission reference; reviewer; and explicit unknowns. Never infer a missing date, unit basis, transaction status, or validity period.

## Source families and access posture

| Source family | Best use | Current posture |
| --- | --- | --- |
| Direct developer API, CRM export, or issued price list | New-launch prices, phase/release, payment terms, official validity dates | Preferred. Ask the developer for written rights to receive, cache, display, attribute, and share the permitted fields; get refresh limits and a contact for corrections. A PDF sent to an agent is not automatically licensed for reuse in a company tool or buyer brief. |
| Contracted property-portal feed/API | Listings or new-project advertisements, within the API contract | Preferred for listings only after written partner approval and a scoped agreement. Property Finder's public developer network describes application and partnership onboarding. Its public user terms prohibit automated scraping and use of site content to build a property database or compete without specific authorization. |
| Nawy public listing/search endpoints | Discovery of primary-project offers | Do not automate from public pages/endpoints without express written permission. Its terms restrict automated queries/scraping and reuse. Pursue a formal feed/API agreement instead. |
| RED / other market portals | Discovery and cross-checks | Terms and data rights must be reviewed for the specific site and data. No source is approved just because it exposes a public page or has been used by a legacy script. |
| Dubizzle Egypt | Resale asking-price observations | No crawler, browser automation, mirrored listings, or commercial aggregation. Its terms restrict collection, aggregation, copying, data mining and robots absent express permission; the listed RSS allowance is not a commercial product feed. Seek a written commercial feed/partnership. |
| Government property-discovery platform | Project/listing discovery and official service links | Not proof of a completed transaction, price validity, title, or availability. The platform disclaims accuracy/completeness/timeliness and its terms prohibit unauthorized extraction/reuse. Use only an approved interface/permission for structured ingestion. |
| WhatsApp developer/sales groups | A human may receive an authorized price sheet or message | Do not add a personal or company number to groups for automated monitoring. WhatsApp Business App terms prohibit scraping/extracting app data and applications that interact with the app absent prior written consent. A human may enter only the minimum fact from a document/message the company is permitted to use; do not copy group history, participant details, or confidential material. Treat official API group features, if available to an eligible account, as a separate permissioned integration—not access to arbitrary existing groups. |
| Agent/buyer submissions | Leads to verify a potential offer | Treat as unverified until checked with the source owner. Do not convert contact details or private chats into market intelligence without notice, permission, and minimization. |
| Official deed/registry, bank, valuer, or auction data | Transaction/valuation facts when the data owner confirms access rights | Use only with authorized access, a clear definition of the fact, and rights for the intended display. A valuation or auction reserve is not necessarily a completed transaction price. |

Authoritative terms and onboarding references reviewed:

- [Nawy Terms](https://www.nawy.com/terms)
- [Property Finder Egypt Terms of Use](https://www.propertyfinder.eg/en/terms-and-conditions.html)
- [Property Finder Developer Network integration guide](https://pfdn.propertyfinder.com/integration-guide)
- [Dubizzle Egypt Terms of Use](https://help.dubizzle.com.eg/hc/en-us/articles/4405534023823-What-are-Terms-of-Use)
- [WhatsApp Business App Terms](https://www.whatsapp.com/legal/WhatsApp-Terms-for-WhatsApp-Business-App)
- [Egyptian Real Estate Platform Terms](https://realestate.gov.eg/en/terms-and-conditions)

Terms and API access can change; review the current agreement and get qualified legal review before relying on an integration. This policy is product guidance, not legal advice.

## WhatsApp and phone-number decision

A company-controlled number can be useful for ordinary, consented business communication and human receipt of documents. It does **not** provide general access to messages in developer groups and does not make their content safe to copy into a commercial database. Do not automate WhatsApp Web, export group history, monitor notifications, or connect an unapproved client.

If a developer wants to send prices through WhatsApp, the acceptable v1 workflow is:

1. The developer confirms in writing that Xcelias may use the specific price facts and documents in internal tools and buyer-facing briefs.
2. An authorized employee transcribes the minimal relevant facts into the evidence form, including capture date, unit/phase basis and source reference.
3. The employee confirms the permission checkbox and checks the values with the developer before sharing.
4. Private message text, unrelated offers, phone numbers and group participant details are not retained.

If an official WhatsApp Business Platform/API integration is considered later, first confirm account eligibility, exact documented endpoints, the permitted group scope, data-protection roles, message/participant visibility, opt-in, retention, and Meta's current terms. No such connector is part of this module.

## Resale and Dubizzle decision

Dubizzle may be a valuable resale-market partner, but a scraper is not the path. Ask for an approved commercial feed or partnership defining these fields and rights: listing ID, project/unit match, ask price/currency, seller or broker role (without unnecessary identity), listing status, last-updated time, expiry/removal signal, attribution, cache limits, display rights, rate limits, and deletion/update obligations. Until then, the product must not crawl or republish Dubizzle listings. A resale ask must be labeled “asking price” and kept separate from new-developer launch prices and verified completed-sale records.

## Permission registry required before an API is enabled

For every source, store a reviewed record containing:

- provider and legal data owner;
- authorization state: `not-reviewed`, `permission-required`, `approved-limited`, `approved` or `revoked`;
- contract or permission reference, owner, start/expiry, and review date;
- exact allowed endpoints and fields, commercial use, cache duration, attribution, and buyer display rights;
- rate limits, freshness schedule, change/removal signals, and failure behavior;
- personal/confidential data exclusions and deletion/retention obligations;
- approved reviewer and escalation contact.

The connector must fail closed unless status is `approved` and all required scope fields are present. Do not put access tokens or private price sheets in source control. A legal or contract expiry revokes automated collection until re-reviewed.

## Refresh policy

Hourly is not the default. Faster polling does not make a price more true and can violate source limits. Prefer provider webhooks or revision feeds. Otherwise configure a source-specific schedule within the agreement: for example, daily checks for regularly published launch books and more frequent checks only for a licensed resale feed that provides dependable update timestamps. Treat the source's timestamp as evidence; store our capture time separately. Surface “last successful check,” “last observed change,” and “last published change” separately. If any is unknown, say so.

## Safe first rollout

1. Use local agent-entered observations with an explicit permission confirmation and source/date/basis fields.
2. A daily CSV may be prepared from facts Xcelias is authorized to use. The browser validates the file format, dates, currency, and required source fields; it does not determine whether the submitter actually has legal rights. Each row is staged as pending and excluded from buyer briefs until a reviewer inspects the rows, sources, and permission references and explicitly approves the batch. Duplicate facts are skipped; malformed batches are rejected as a whole.
3. In the first implementation, CSV parsing and saved data stay in the signed-in user's browser profile. The feature is not a shared team inbox, does not retain the uploaded file, and does not upload the contents to Xcelias servers. Staff must use the same approved browser profile or export/import a protected backup; do not use shared/public devices.
4. Let the deterministic Deal Stress Test flag missing dates/terms, mismatched units/phases, and source disagreement. Do not average prices or let AI declare a winner.
5. Build an integration only after the source agreement exists; test it against a sandbox or a small, approved dataset.
6. Add shared storage, collaborative review, public links/QR, retention, and revoke/expiry only after the security and privacy model is approved.
7. Preserve an audit trail for changes and corrections; show buyers when facts were captured and exactly what is still unknown.

The current local workspace does not connect or represent any source as authorized. The existing scheduled Property Explorer collector is legacy infrastructure and requires a separate permissions review; this module neither consumes it nor silently changes it.
