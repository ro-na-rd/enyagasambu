# NMO Spec vs Implementation Gap Analysis

## Current implementation summary
- Backend: Node.js + Express with MySQL / `mysql2`.
- Authentication: email/password JWT for users, with admin role checks.
- Listings: create, read, boost, and unlock contact via coin balance.
- Payments: MTN MoMo integration is currently used for purchasing coins, not for listing/contact payments directly.
- OTP: Africa's Talking SMS OTP is used for contact unlock verification, but only for authenticated users.
- Subscriptions: seller subscription plans exist and modify listing duration.
- Admin: admin endpoints available, but staff login and staff-only flows are not implemented as in the spec.

## Major spec gaps
### 1. Buyer/Seller authentication model
- Spec expects buyers and sellers to use phone number only, with OTP-based sessions.
- Current code requires user registration/login with email and password.
- Seller listing creation is not phone-only.

### 2. Payment flow
- Spec defines direct MTN/Airtel payment for:
  - listing token purchases
  - contact reveal
  - listing renewals
- Current app uses MoMo only to top up coins, then spends coins on actions.
- There is no `payments` table or direct payment webhook flow for listing and contact actions.

### 3. Contact reveal flow
- Spec requires buyer contact reveal via mobile money payment and a dedicated `contact_reveals` table.
- Current implementation allows contact unlock by paying coins, not through mobile money payment confirmation.
- There are no `reveals/initiate`, `reveals/confirm`, or `reveals/:buyer_phone/:listing_id` endpoints.

### 4. Listing renewal flow
- Spec requires SMS renewal token, renewal endpoint, and scheduled expiry notifications.
- Current app does not store renewal tokens or use SMS renewal workflows.
- Listing expiry is based on subscription-based duration rather than explicit 3/7/30-day checkout pricing.

### 5. Admin/staff model
- Spec expects staff accounts with username/password + OTP and admin dashboard controls.
- Current backend only has user roles within the `users` table and lacks a separate `staff` model and staff OTP login.
- Staff endpoints for refunds, revenue summary, and broadcast SMS are missing.

### 6. Database schema mismatch
- Spec describes PostgreSQL with UUID primary keys, `contact_reveals`, `payments`, `staff`, and renewal token tables.
- Current schema is MySQL-focused and does not contain many of the spec tables.

## Fixes applied
- Added `staff`, `seller_otps`, `staff_otps`, `payments`, `contact_reveals`, and `renewal_tokens` tables to the schema.
- Added `POST /api/reveals/initiate`, `POST /api/reveals/confirm`, and `GET /api/reveals/:buyer_phone/:listing_id`.
- Added `POST /api/auth/seller/request-otp` and `POST /api/auth/seller/verify-otp` for phone-only seller session tokens.
- Added `POST /api/admin/auth/login` and `POST /api/admin/auth/verify-otp` for staff login.
- Added `POST /api/listings/initiate` and `POST /api/listings/confirm` for direct listing token payments.
- Added listing renewal token support with `POST /api/listings/:id/renew/initiate`, `PATCH /api/listings/:id/renew`, and renewal SMS dispatch.

## Remaining gaps
- Buyer contact reveal now has a direct payment flow, but frontend integration may still be required.
- Renewal token SMS dispatch is scheduled on backend startup; real production deployment should verify SMS credentials and availability.

## Immediate implementation notes
- The backend now supports both legacy coin-based listing creation and the new phone-token payment flow.
- Incoming phone-only seller sessions are stored as `seller` users with OTP login.
- The existing MTN MoMo service is reused for listing, renewal, and contact reveal payments.

## Status
- ✅ Payment integration exists for MTN MoMo coin top-up.
- ⚠️ Payment integration does not yet cover listing/contact/renewal payments per spec.
- ⚠️ Auth model is not aligned with anonymous buyer and phone-only seller flows.
- ⚠️ Admin staff OTP and renewal SMS logic are missing.
