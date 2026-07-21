# NMO Spec vs Implementation Gap Analysis

## Current implementation summary
- Backend: Node.js + Express with MySQL / `mysql2`.
- Authentication: email/password JWT for users, with admin role checks.
- Listings: create, read, boost, and unlock contact via coin balance.
- Payments: MTN MoMo integration for coin top-up AND direct listing payment with OTP verification.
- OTP: Africa's Talking SMS OTP for contact unlock verification AND listing payment verification.
- Subscriptions: seller subscription plans exist and modify listing duration.
- Admin: admin endpoints available with staff login and OTP flows.

## Major spec gaps (addressed)
### 1. Buyer/Seller authentication model
- ✅ Phone-only seller OTP login implemented (`/api/auth/seller/request-otp`, `/api/auth/seller/verify-otp`).
- ✅ Guest listing creation supported (auto-creates user account).

### 2. Payment flow
- ✅ Direct MTN MoMo payment for listing creation with OTP verification.
- ✅ `payments` table with status tracking: `pending` → `verified` → `confirmed`.
- ✅ `payment_otps` table for 6-digit OTP codes (5-minute TTL, single-use).
- ✅ Contact reveal via direct MoMo payment (`/api/reveals/initiate`, `/api/reveals/confirm`).
- ✅ Listing renewal via MoMo payment with SMS renewal tokens.

### 3. Contact reveal flow
- ✅ Direct payment flow via MoMo (`/api/reveals/initiate`, `/api/reveals/confirm`).
- ✅ `contact_reveals` table tracks reveals.

### 4. Listing renewal flow
- ✅ SMS renewal tokens generated at listing creation.
- ✅ Renewal endpoints: `/api/listings/:id/renew/initiate`, `PATCH /api/listings/:id/renew`.
- ✅ Scheduled renewal SMS dispatch (hourly cron).

### 5. Admin/staff model
- ✅ `staff` table with username/password/phone/role.
- ✅ Staff OTP login (`/api/admin/auth/login`, `/api/admin/auth/verify-otp`).
- ✅ Admin endpoints for user/listing/promo management.

### 6. Database schema
- ✅ `payments`, `contact_reveals`, `renewal_tokens`, `staff`, `seller_otps`, `staff_otps` tables added.
- ✅ `payment_otps` table for listing payment verification OTPs.

## Payment OTP flow (newly implemented)
### Flow
1. User fills listing form → clicks "Pay & Post"
2. Backend creates `payments` record (status: `pending`) + sends MoMo USSD prompt
3. User enters MoMo PIN → payment confirmed
4. Backend confirms MoMo status → sets payment to `verified` → returns `payment_verified`
5. Frontend triggers OTP send → backend generates 6-digit code, sends via SMS
6. User enters OTP → backend verifies + creates listing + marks payment `confirmed`
7. Confirmation SMS sent → user sees success screen

### Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `POST /api/listings/initiate` | POST | Create payment + send MoMo request |
| `POST /api/listings/confirm` | POST | Poll MoMo status → return `payment_verified` |
| `POST /api/listings/payment-otp/send` | POST | Generate + send 6-digit OTP |
| `POST /api/listings/payment-otp/verify` | POST | Verify OTP + publish listing |
| `POST /api/listings/payment-otp/resend` | POST | Resend expired/failed OTP |

### Security
- OTPs expire after 5 minutes, single-use only
- Each payment linked to one listing (enforced by DB)
- System verifies payment with MoMo API before sending OTP
- Images uploaded to S3 only after OTP verification
- Atomic transactions for listing creation

## Admin posting free toggle
- ✅ `platform_settings` table stores `posting_free` and `posting_fee` settings.
- ✅ `GET /api/settings` returns all platform settings (public).
- ✅ `PUT /api/settings` updates settings (admin-only, `authenticate + requireAdmin` middleware).
- ✅ `createListing` checks `posting_free` — skips coin deduction when true.
- ✅ Guest listings always free (bypass coin check regardless of setting).
- ✅ Frontend admin settings page: toggle switch for fee enabled/disabled, coin amount input.
- ✅ Frontend create listing page: fetches `posting_free` on mount, routes to free or paid flow.
- ✅ All 15 integration tests pass (guest free, auth free, auth paid, coin deduction, toggle cycling).

## Remaining gaps
- SMS delivery requires valid Africa's Talking credentials (sandbox key currently used).
- Airtel Money integration not yet implemented (MTN MoMo only).
- Webhook-based payment confirmation not implemented (currently uses polling).
- Frontend pages for admin, broker, and ambassador portals may be placeholder stubs.

## Status
- ✅ MTN MoMo payment integration (coin top-up + listing payment + contact reveal + renewal).
- ✅ Payment OTP verification flow for listing creation.
- ✅ Admin posting free toggle with full integration tests.
- ✅ Phone-only seller OTP login.
- ✅ Guest listing creation with auto-account.
- ✅ Staff OTP login.
- ✅ Listing renewal with SMS tokens.
- ✅ Contact reveal via MoMo payment.
- ✅ i18n support (English, French, Kinyarwanda).
- ⚠️ SMS credentials need production Africa's Talking configuration.
- ⚠️ Airtel Money integration pending.
