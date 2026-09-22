# E-Nyagasambu
## Rwanda's Digital Marketplace
### Human User Experience Specification

**Document type:** Human User Experience Specification, Architect Edition  
**Scope:** Buyer, Seller, Supplier, Broker, Ambassador, Staff, and Executive experiences  
**Audience:** Software architects, principal engineers, technical leads  
**Purpose:** Define the complete human experience, system behaviour, data flows, and constraints behind every major platform interaction.

---

## 1. How to Read This Document

This specification follows each persona from arrival to completion of their task. Every journey contains:

- A character portrait and acceptance criteria.
- A narrative walkthrough from the user's perspective.
- A step table mapping user action, system response, and architect note.
- Friction points and architectural mitigations.
- Cross-cutting security, reliability, and performance constraints.

The architect note is normative. It translates a human moment into a technical requirement.

## 2. Platform Context

E-Nyagasambu is a mobile-first Rwandan marketplace for products, properties, vehicles, and services. Buyers browse freely. Sellers and account holders use the appropriate verification model for their persona.

| Parameter | Target |
|---|---|
| Primary device | Low-to-mid-range Android phone |
| Network | Intermittent 3G/4G mobile data |
| Languages | Kinyarwanda first, French and English supported |
| Payments | MTN Mobile Money and Airtel Money USSD push |
| SMS | Africa's Talking for OTP and renewal notifications |
| Frontend | Next.js SSR/ISR, mobile-first |
| Backend | Node.js/Express REST API |
| Database | MariaDB/MySQL-compatible relational database |
| Storage | S3-compatible object storage delivered through a CDN |
| Authentication | JWT for account holders; OTP/session tokens for seller workflows |

### Personas and authentication tiers

| Tier | Personas | Authentication |
|---|---|---|
| Open marketplace | Buyer, Seller | Buyer anonymous; Seller phone + OTP session |
| Account holders | Supplier, Broker, Ambassador | Username/email + password + OTP, short-lived JWT |
| Operations | Staff | Staff credentials + OTP, permission-based access |
| Leadership | Executive | Role-scoped credentials + OTP, role-filtered data |

## 3. Foundational Design Decisions

### 3.1 Browsing has no registration wall
A first-time buyer must be able to load the homepage, search, filter, and open a listing without creating an account. Authentication is required only for protected actions.

**Implications:** SSR/ISR for public pages, anonymous-safe APIs, and no client-only gate before first paint.

### 3.2 Seller contact is protected until a confirmed payment
Seller phone numbers must never appear in public listing responses. A dedicated reveal flow checks listing status, existing access, payment state, and provider confirmation before returning the number.

### 3.3 Seller posting uses phone verification
A seller enters a phone number, receives an OTP, and only then sees the listing form. OTPs are hashed, expire, have attempt limits, and are rate-limited by phone and IP.

### 3.4 Mobile money is the launch payment rail
All payment flows use MTN Mobile Money or Airtel Money. Payment state is `pending -> confirmed | failed | refunded`. Webhooks are signature-validated and idempotent by provider reference.

### 3.5 Moderation is a publication gate
Uploads first enter private quarantine storage. Moderation must complete before a listing can become public. Borderline content enters a staff queue; prohibited content is blocked and audited.

## 4. Buyer Journey

### Character portrait
Honorine is a mobile buyer in Kicukiro using a Tecno phone on 3G. She wants a sofa or rental property. She will leave if registration blocks browsing, pages are slow, or she pays for a contact that cannot be used.

### Narrative
Honorine opens the site and immediately sees active listings without signing up. She filters Properties, opens a listing, reviews photos and price, and taps **View owner contact — 300 RWF**. The platform creates a pending mobile-money payment. Once the provider webhook confirms it, the contact is revealed and sent by SMS. Returning to the same listing shows the saved reveal without another charge.

### Step table

| User action | System response | Architect requirement |
|---|---|---|
| Open homepage | SSR returns active listings | First paint target under 3 seconds on 3G |
| Open listing | Listing detail loads | Never serialize `seller_phone` |
| Request contact | Payment/reveal attempt created | Check listing is active and existing access first |
| Confirm PIN | Provider webhook arrives | Verify signature and enforce idempotency |
| Return later | Existing reveal is found | Never charge twice for the same buyer/listing pair |

### Buyer friction controls

- Never initiate payment for expired, removed, or suspended listings.
- Reconcile pending payments older than five minutes.
- Send the revealed contact by SMS as a fallback if the browser closes.
- Show clear pending, confirmed, failed, and retry states.

## 5. Seller Journey

### Character portrait
Jean-Pierre is an Airtel user who wants to list a vehicle and renew it without remembering a password. He will leave if OTP delivery, photo upload, or payment status is unclear.

### Narrative
Jean-Pierre selects **Post a listing**, verifies his phone by OTP, completes a category-specific form, uploads photos, chooses a duration, and confirms payment. The listing becomes visible only after confirmed payment and successful moderation. Twenty-four hours before expiry, he receives a renewal SMS and can renew from any phone using a one-time token.

### Step table

| User action | System response | Architect requirement |
|---|---|---|
| Start posting | Show phone field only | Do not expose the full form before OTP verification |
| Request OTP | Create short-lived OTP session | Hash OTP, limit attempts, limit resend frequency |
| Verify OTP | Issue scoped seller session | Token includes phone, purpose, issue and expiry times |
| Complete form | Validate category fields | Server validates all required fields and pricing |
| Upload photos | Quarantine and moderate | Listing cannot activate before all photos pass |
| Pay listing fee | Create pending payment | Amount comes from server-side pricing config |
| Webhook confirms | Activate listing and set expiry | Webhook is the only activation path |
| Renewal SMS arrives | Open renewal flow | Token is hashed, single-use, and expires after 48 hours |

### Seller friction controls

- Resend OTP after 30 seconds, maximum three per hour per phone.
- Preserve successful uploads in a temporary draft if the connection drops.
- Explain rejected files without exposing moderation rules.
- Warn about likely duplicate listings without blocking legitimate reposts.

## 6. Supplier Journey

A Supplier is a verified business with a persistent workspace. The dashboard provides listings, stock/pricing management, bulk CSV upload, contact-reveal performance, and moderation status.

| User action | System response | Architect requirement |
|---|---|---|
| Login | Password and OTP are verified | Issue an 8-hour JWT with server-derived permissions |
| Download CSV | Generate current schema template | Template version must match the active schema |
| Upload 50 products | Return an upload job and progress | Validate every row; never silently skip errors |
| Photos are reviewed | Approved listings go live | Borderline items remain `pending_approval` |
| Change price | Update listing in place | Preserve expiry and payment history; audit the change |
| View performance | Show views and reveals | Use counters or aggregates, not repeated full-table counts |

## 7. Broker Journey

A Broker manages listings for clients within an assigned region. The regional filter is enforced on the server. Broker verification records the broker, timestamp, documents, and audit entry. Client phone numbers remain the client's numbers during contact reveal.

**Required flows:** regional dashboard, verification queue, client listing creation, commission tracker, and exportable commission statement.

**Constraints:** private verification documents, versioned commission rates, server-side region enforcement, and immutable audit records.

## 8. Ambassador Journey

An Ambassador invites people, tracks referral stages, and views earned rewards. Stages are derived from facts rather than manually synchronized status fields:

`Invited -> Verified -> Posted -> Paid`

Adding a referral creates a row and sends an SMS. A confirmed first listing payment creates the reward. Ambassadors may export statements but cannot trigger payouts themselves.

## 9. Staff and Admin Journey

Staff operate the moderation, support, and operational queues from the Admin dashboard. A staff member should see actionable work first: pending approvals, reports, open support tickets, failed payments, and stale webhooks.

| User action | System response | Architect requirement |
|---|---|---|
| Open moderation queue | Show pending listings | Seller phone hidden by default |
| Approve listing | Activate and audit | Record actor, previous state, new state, time, and IP |
| Investigate failed reveal | Show confirmed payment without reveal | Manual reveal requires confirmed payment and a reason |
| Post for seller | Verify seller OTP | Preserve actual seller phone and staff actor separately |
| Resolve support ticket | Save resolution and notify user | Store notes, resolver, timestamp, and SMS result |

Staff permissions must be explicit. Moderators cannot change pricing, access executive MIS data, or reveal PII without an auditable operational reason.

## 10. Executive Journey

Executives receive role-scoped dashboards for CEO, CIO, COO, CMO, and CFO responsibilities. The same domain data is serialized according to permissions rather than copied into insecure role-specific endpoints.

- CEO: aggregated revenue, growth, and operational alerts.
- CIO: audit, reliability, security, and platform health.
- COO: operations, support, moderation, and regional activity.
- CMO: campaigns, referrals, acquisition, and conversion.
- CFO: financial detail, payments, commissions, and reconciliation.

Every executive write action uses a transaction, an approval record where relevant, and an immutable audit event. Sensitive personal data is masked or excluded from executive summaries.

## 11. Cross-Cutting Requirements

### 11.1 Phone number and PII

- `seller_phone` is absent from public listing responses.
- Buyer phone is captured only for a payment/reveal flow.
- Executive responses mask phone numbers, for example `+25078*****22`.
- OTP and payment rate limiting uses phone and IP.
- Logs must redact phone numbers, tokens, passwords, and payment credentials.

### 11.2 Payment state machine

| State | Trigger |
|---|---|
| `pending` | Provider request accepted |
| `confirmed` | Signature-validated webhook |
| `failed` | Provider failure or reconciliation timeout |
| `refunded` | Staff-authorized reversal |

No client callback alone can activate a listing or reveal a contact. A unique provider reference prevents duplicate effects.

### 11.3 Listing lifecycle

`pending_approval -> active -> expired -> removed`  
Additional moderation state: `suspended`.

Transitions are server-side, audited, and idempotent. Public queries include only listings that are active, unexpired, and allowed by moderation policy.

### 11.4 Moderation

- Quarantine uploads before publication.
- Run image checks before activation.
- Block known prohibited content automatically.
- Route borderline content to staff.
- Keep moderation metadata private and audit all decisions.

### 11.5 Audit logging

Every account-holder write records actor, role, timestamp, IP, action, target, old value, new value, and reason. Audit records are append-only, retained for at least two years, and readable only through role-filtered endpoints.

### 11.6 SMS as a primary interface

OTP, renewal, referral, contact reveal, and support-resolution messages require delivery tracking, retry policy, rate limits, deduplication, and user-friendly copy. SMS is a fallback for every flow that can be interrupted by a lost connection.

### 11.7 Performance contract

| Experience | Target |
|---|---|
| Homepage first paint on 3G | Under 3 seconds |
| Listing detail | Under 2 seconds |
| OTP delivery | Under 15 seconds |
| Payment confirmation | Under 5 seconds after PIN entry |
| Five-photo upload and moderation | Under 30 seconds or clear progress |
| Admin dashboard | Under 3 seconds using aggregates/caches |

## 12. Acceptance Checklist

### Public and Buyer

- [ ] Homepage, search, filters, and listing details work without registration.
- [ ] Public listing responses never contain seller phone numbers.
- [ ] Expired and suspended listings cannot start a payment.
- [ ] A confirmed reveal is available after returning to the listing.
- [ ] Duplicate reveal attempts do not double-charge.

### Seller

- [ ] OTP is hashed, expires, and is rate-limited.
- [ ] Category-specific fields validate on both client and server.
- [ ] Photos cannot become public before moderation passes.
- [ ] Listing activation happens only after confirmed payment.
- [ ] Renewal tokens are single-use and SMS delivery is observable.

### Account holders and operations

- [ ] Role and permissions are enforced server-side.
- [ ] Supplier bulk uploads report row-level validation errors.
- [ ] Broker region restrictions cannot be bypassed.
- [ ] Ambassador rewards are webhook-driven and cannot be self-awarded.
- [ ] Staff and executive writes are audited.

### Reliability and safety

- [ ] Payment webhooks are signature-validated and idempotent.
- [ ] Pending payments are reconciled.
- [ ] User-facing failures provide recovery actions, not blank states.
- [ ] Health and readiness endpoints distinguish liveness from dependencies.
- [ ] Logs redact credentials, tokens, and PII.

---

**E-Nyagasambu — Human User Experience Specification v1.0**  
**For Software Architects and Technical Leads**  
**Rwanda, 2025**
