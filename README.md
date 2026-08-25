# E-Nyagasambu (NMO)

A full-stack marketplace platform for buying, selling, renting, and auctioning products and services. Built with a Node.js/Express backend, Next.js 16 frontend, MariaDB database, MinIO object storage, and real-time communication via Socket.IO.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend](#backend)
  - [API Entry Point](#api-entry-point)
  - [Routes](#routes)
  - [Controllers](#controllers)
  - [Services](#services)
  - [Middleware](#middleware)
  - [Database Schema](#database-schema)
  - [Migrations & Seeds](#migrations--seeds)
- [Frontend](#frontend)
  - [App Directory (Pages)](#app-directory-pages)
  - [Components](#components)
  - [Contexts](#contexts)
  - [Library Utilities](#library-utilities)
- [User Roles](#user-roles)
- [Core Features](#core-features)
  - [Listings & Auctions](#listings--auctions)
  - [Coin System & Payments](#coin-system--payments)
  - [Contact Access & Reveal](#contact-access--reveal)
  - [Certificates](#certificates)
  - [Notifications](#notifications)
  - [Referrals & Rewards](#referrals--rewards)
  - [Content Management](#content-management)
  - [Support & Reporting](#support--reporting)
  - [Announcements](#announcements)
  - [Donations](#donations)
  - [Ratings & Comments](#ratings--comments)
  - [Recycle Bin](#recycle-bin)
- [Services Breakdown](#services-breakdown)
- [Docker Deployment](#docker-deployment)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Launch Scripts](#launch-scripts)

---

## Architecture Overview

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │─────▶│   Backend    │─────▶│   Database   │
│  Next.js 16  │      │  Express.js  │      │  MariaDB     │
│  React 19    │      │  Socket.IO   │      │  (MySQL)     │
│  Tailwind 4  │      │  Port 5000   │      │  Port 3307   │
│  Port 3000   │      └──────┬───────┘      └──────────────┘
└──────────────┘             │
                             ├────▶ MinIO (S3-compatible storage, ports 9000/9001)
                             ├────▶ Africa's Talking (SMS)
                             ├────▶ Nodemailer (Email via SMTP)
                             └────▶ MTN MoMo API (Mobile Money payments)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Chart.js, React Hook Form, Socket.IO Client |
| **Backend** | Node.js, Express.js, Socket.IO, Multer, Express Validator, UUID |
| **Database** | MariaDB 10.11 (MySQL-compatible) |
| **Object Storage** | MinIO (S3-compatible) |
| **Authentication** | JWT (jsonwebtoken), bcryptjs |
| **Email** | Nodemailer (SMTP/Gmail) |
| **SMS** | Africa's Talking |
| **Payments** | MTN Mobile Money (MoMo API) |
| **Containerization** | Docker, Docker Compose |
| **Dev Tools** | Nodemon, ESLint, TypeScript |

---

## Project Structure

```
enyagasambu-main/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── index.js            # Server entry point
│   │   ├── config/             # Database, schema, Socket.IO config
│   │   ├── controllers/        # Route handlers (46 controllers)
│   │   ├── middleware/          # Auth, rate limiter
│   │   ├── routes/             # API route definitions (42 routes)
│   │   ├── services/           # Business logic services (10 services)
│   │   └── scripts/            # Migration & seed scripts
│   ├── migrations/             # Database migration files
│   ├── uploads/                # Uploaded files
│   ├── Dockerfile              # Backend container image
│   ├── package.json            # Backend dependencies
│   └── .env                    # Backend environment variables
├── frontend/                   # Next.js 16 application
│   ├── src/
│   │   ├── app/                # App directory (pages & layouts)
│   │   │   ├── (auth)/         # Auth pages (login, register, password reset)
│   │   │   ├── (main)/         # Public-facing pages
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── ambassador/     # Ambassador portal
│   │   │   ├── broker/         # Broker portal
│   │   │   └── supplier/       # Supplier portal
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React contexts (Auth, Language, Currency)
│   │   └── lib/                # Utilities (API client, config, translations, etc.)
│   ├── public/                 # Static assets
│   ├── Dockerfile              # Frontend container image
│   ├── next.config.ts          # Next.js configuration
│   └── package.json            # Frontend dependencies
├── docker-compose.yml          # Multi-service container orchestration
├── launch.bat                  # Windows batch launcher
├── launch-hidden.vbs           # Hidden window launcher (VBScript)
├── start-all.ps1               # PowerShell start script
├── start-all-v2.ps1            # Updated PowerShell start script
├── restart-all.ps1             # PowerShell restart script
├── start-backend.bat           # Backend-only start script
├── start-frontend.bat          # Frontend-only start script
├── start-servers.bat           # Combined server start (BAT)
├── start-servers.ps1           # Combined server start (PowerShell)
├── certificate-preview.html    # Certificate HTML preview
├── certificate-preview-enhanced.html  # Enhanced certificate preview
├── .env                        # Root environment variables
└── .gitignore                  # Git ignore rules
```

---

## Backend

### API Entry Point

`backend/src/index.js`

- Initializes Express with CORS, JSON parsing, and URL-encoded body parsing.
- Connects to MinIO on startup (`waitForS3`, `ensureBucket`).
- Mounts 42 API route modules under `/api`.
- Starts three background schedulers:
  - **Renewal Scheduler** — handles listing renewal reminders.
  - **Expiry Scheduler** — auto-expires listings past their deadline.
  - **Auction Scheduler** — manages auction lifecycle (start, end, close).
- Initializes Socket.IO for real-time features.
- Provides a `/api/health` endpoint for health checks.

### Routes

42 route modules organized by domain:

| Route Prefix | File | Purpose |
|-------------|------|---------|
| `/api/auth` | `auth.js` | User registration & login |
| `/api/auth/seller` | `sellerAuth.js` | Seller-specific authentication |
| `/api/auth/broker` | `brokerAuth.js` | Broker authentication |
| `/api/auth/ambassador` | `ambassadorAuth.js` | Ambassador authentication |
| `/api/auth/supplier` | `supplierAuth.js` | Supplier authentication |
| `/api/admin/auth` | `adminAuth.js` | Admin/staff login |
| `/api/admin` | `admin.js` | Admin dashboard operations |
| `/api/admin/certificates` | `adminCertificates.js` | Manage user certificates |
| `/api/admin/broker-certificates` | `adminBrokerCertificates.js` | Manage broker certificates |
| `/api/admin/supplier-certificates` | `adminSupplierCertificates.js` | Manage supplier certificates |
| `/api/admin/certificate-types` | `adminCertificateTypes.js` | Manage certificate types |
| `/api/admin/announcements` | `adminAnnouncements.js` | Create/manage announcements |
| `/api/listings` | `listings.js` | CRUD for listings |
| `/api/listings/phone-access` | `phoneListings.js` | Phone-based listing access |
| `/api/categories` | `categories.js` | Listing categories |
| `/api/coins` | `coins.js` | Coin balance & transactions |
| `/api/otp` | `otp.js` | OTP verification |
| `/api/subscriptions` | `subscriptions.js` | Seller subscription plans |
| `/api/referrals` | `referrals.js` | Referral program |
| `/api/reports` | `reports.js` | Listing reports |
| `/api/broker` | `broker.js` | Broker dashboard & operations |
| `/api/broker/certificate` | `brokerCertificate.js` | Broker certificate management |
| `/api/ambassador` | `ambassadorActivities.js` | Ambassador activities |
| `/api/ambassador/certificate` | `ambassadorCertificate.js` | Ambassador certificate management |
| `/api/suppliers` | `suppliers.js` | Supplier management |
| `/api/supplier/certificate` | `supplierCertificate.js` | Supplier certificate management |
| `/api/certificate-types` | `certificateTypes.js` | Public certificate type listing |
| `/api/settings` | `settings.js` | Platform settings |
| `/api/unlock` | `unlock.js` | Contact unlock flow |
| `/api/contact-access` | `contactAccess.js` | Contact access payments |
| `/api/likes` | `likes.js` | Listing likes |
| `/api/ratings` | `ratings.js` | Star ratings |
| `/api/comments` | `comments.js` | Listing comments |
| `/api/content` | `content.js` | CMS content pages |
| `/api/support` | `support.js` | Support requests |
| `/api/stats` | `stats.js` | Platform statistics |
| `/api/donations` | `donations.js` | Donation processing |
| `/api/notifications` | `notifications.js` | User notifications |
| `/api/announcements` | `announcements.js` | Public announcements |
| `/api/auctions` | `auctions.js` | Auction bidding & management |
| `/api/reveals` | `reveals.js` | Contact reveal payments |
| `/api/recycle-bin` | `recycleBin.js` | Soft-deleted listing recovery |

### Controllers

46 controller files implementing business logic for each domain. Key controllers include:

- **authController.js** — User registration, login, JWT generation, profile management.
- **listingController.js** — Full listing CRUD, image upload, search, filtering, featured listings.
- **auctionController.js** — Bid placement, auction watch, bid history, anti-sniping.
- **coinController.js** — Coin purchases via MoMo, balance queries, transaction history.
- **brokerClientsController.js** — Broker-client relationship management.
- **brokerCommissionsController.js** — Commission tracking and calculations.
- **brokerMessagesController.js** — Direct messaging between brokers and clients.
- **ambassadorActivityController.js** — Ambassador activity tracking and rewards.
- **supplierController.js** — Supplier profiles and business listings.
- **donationController.js** — Donation processing via MoMo or card.
- **revealController.js** — Contact reveal payment flow.
- **recycleBinController.js** — Soft-deleted listing recovery.

### Services

10 service modules handling background tasks and integrations:

| Service | Purpose |
|---------|---------|
| `emailService.js` | Sends emails via Nodemailer (SMTP/Gmail) |
| `smsService.js` | Sends SMS via Africa's Talking API |
| `momoService.js` | MTN MoMo payment integration (collection & provisioning) |
| `s3Service.js` | MinIO/S3 file upload, download, and bucket management |
| `notificationService.js` | In-app notification creation and Socket.IO push |
| `renewalScheduler.js` | Periodic check for listing renewal needs |
| `expiryScheduler.js` | Auto-expire listings past their deadline |
| `auctionScheduler.js` | Auction lifecycle management (start, end, close) |
| `brokerCommissionService.js` | Commission calculation and payout logic |
| `brokerLeadService.js` | Broker lead generation and tracking |

### Middleware

- **auth.js** — JWT token verification, role-based access control (supports `user`, `seller`, `admin`, `broker`, `ambassador`, `supplier`, `staff` roles).
- **rateLimiter.js** — API rate limiting to prevent abuse.

### Database Schema

`backend/src/config/schema.sql` — MariaDB schema with 35+ tables:

| Table | Purpose |
|-------|---------|
| `users` | All platform users (buyers, sellers, brokers, ambassadors, suppliers) |
| `staff` | Admin and moderator accounts |
| `listings` | Product, rental, and auction listings |
| `listing_images` | Image attachments for listings |
| `categories` | 23 predefined listing categories |
| `coin_transactions` | Coin purchase, spend, and refund records |
| `contact_unlocks` | Seller-side contact unlocks |
| `contact_access_payments` | Buyer-side contact access payments |
| `momo_payments` | MTN MoMo payment records |
| `payments` | General payment tracking |
| `payment_otps` | OTP codes for payment verification |
| `otp_codes` | General OTP codes |
| `seller_otps` | Seller-specific OTP codes |
| `staff_otps` | Staff-specific OTP codes |
| `seller_subscriptions` | Seller subscription plans (free, standard, premium) |
| `referrals` | Referral relationships and bonus tracking |
| `promo_codes` | Promotional discount codes |
| `password_resets` | Password reset tokens |
| `certificate_types` | Configurable certificate types (broker, ambassador, supplier) |
| `broker_certificates` | Issued broker certificates |
| `ambassador_certificates` | Issued ambassador certificates |
| `supplier_certificates` | Issued supplier certificates |
| `broker_messages` | Broker-client messages |
| `platform_settings` | Global platform configuration |
| `listing_likes` | User likes on listings |
| `listing_ratings` | Star ratings on listings |
| `listing_comments` | Threaded comments on listings |
| `listing_reports` | Listing abuse reports |
| `renewal_tokens` | Tokens for listing renewal verification |
| `support_requests` | Customer support tickets |
| `content_pages` | CMS-managed pages (FAQ, guides, policies) |
| `donations` | Donation records |
| `notifications` | In-app notification messages |
| `announcements` | Platform-wide announcements |
| `auction_bids` | Auction bid records |
| `auction_watches` | Auction watchlist entries |
| `supplier_profiles` | Supplier business profiles |

### Migrations & Seeds

Migration scripts in `backend/src/scripts/`:

- `migrateBrokerCerts.js` — Broker certificate table migration
- `migrateBrokerClients.js` — Broker clients table migration
- `migrateBrokerCommissions.js` — Commission tracking migration
- `migrateBrokerMessages.js` — Messaging system migration
- `migrateCertificateTypes.js` — Certificate types migration
- `migrateListingRatings.js` — Rating system migration
- `migrateListingClientName.js` — Client name field migration
- `migrateSpec.js` — Specification field migration
- `migrateSupplierCerts.js` — Supplier certificate migration
- `migrateAuctions.js` — Auction system migration
- `addAuctionType.js` — Auction listing type migration
- `addListingCurrency.js` — Currency field migration
- `createAdmin.js` — Initial admin account creation
- `seedLegalPages.js` — Seed legal content pages

Seed files:

- `seed-admin.js` — Creates default admin user
- `seed-auctions.js` — Seeds sample auction listings

---

## Frontend

### App Directory (Pages)

Built with Next.js 16 App Router and React 19.

#### Public Pages (`app/(main)/`)

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with featured listings |
| Listings | `/listings` | Browse all listings with filters |
| My Listings | `/my-listings` | User's own listings dashboard |
| Auction | `/auction` | Browse auction listings |
| Register | `/register` | New user registration |
| Coins | `/coins` | Coin purchase page |
| Subscriptions | `/subscriptions` | Seller subscription plans |
| Referral | `/referral` | Referral program dashboard |
| Certificates | `/certificates` | Browse certificate types |
| Certificate | `/certificate` | Purchase and generate certificates |
| Donate | `/donate` | Donation page |
| Support | `/support` | Customer support form |
| FAQ | `/faq` | Frequently asked questions |
| Guide | `/guide` | Platform usage guide |
| About | `/about` | About page |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |
| Verify | `/verify` | Email/phone verification |
| Verify Broker | `/verify-broker` | Broker verification |
| Verify Supplier | `/verify-supplier` | Supplier verification |
| Staff | `/staff` | Staff portal |

#### Auth Pages (`app/(auth)/`)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User login |
| Forgot Password | `/forgot-password` | Password reset request |
| Reset Password | `/reset-password` | Password reset form |

#### Admin Dashboard (`app/admin/`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Admin overview |
| Users | `/admin/users` | User management |
| Listings | `/admin/listings` | Listing moderation |
| Categories | `/admin/categories` | Category management |
| Certificates | `/admin/certificates` | Certificate administration |
| Connects | `/admin/connects` | Contact access management |
| Reports | `/admin/reports` | Reported listings |
| Settings | `/admin/settings` | Platform settings |
| Content | `/admin/content` | CMS content editor |
| Analytics | `/admin/analytics` | Platform analytics |
| Notifications | `/admin/notifications` | Notification management |
| Announcements | `/admin/announcements` | Announcement management |
| Profile | `/admin/profile` | Admin profile |
| Suppliers | `/admin/suppliers` | Supplier management |
| Donations | `/admin/donations` | Donation management |
| Promos | `/admin/promos` | Promo code management |

#### Ambassador Portal (`app/ambassador/`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/ambassador` | Ambassador overview |
| Activities | `/ambassador/activities` | Activity log |
| Referrals | `/ambassador/referrals` | Referral tracking |
| Rewards | `/ambassador/rewards` | Reward claims |
| Certificate | `/ambassador/certificate` | Certificate management |
| Announcements | `/ambassador/announcements` | Ambassador announcements |
| Reports | `/ambassador/reports` | Activity reports |
| Notifications | `/ambassador/notifications` | Notifications |
| Settings | `/ambassador/settings` | Account settings |
| Profile | `/ambassador/profile` | Profile management |
| Help | `/ambassador/help` | Help center |
| Register | `/ambassador/register` | Ambassador registration |
| Login | `/ambassador/login` | Ambassador login |

#### Broker Portal (`app/broker/`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/broker` | Broker overview |
| Clients | `/broker/clients` | Client management |
| Listings | `/broker/listings` | Broker listings |
| Leads | `/broker/leads` | Lead tracking |
| Commissions | `/broker/commissions` | Commission reports |
| Messages | `/broker/messages` | Client messaging |
| Transactions | `/broker/transactions` | Transaction history |
| Certificate | `/broker/certificate` | Certificate management |
| Reports | `/broker/reports` | Business reports |
| Notifications | `/broker/notifications` | Notifications |
| Settings | `/broker/settings` | Account settings |
| Profile | `/broker/profile` | Profile management |
| Help | `/broker/help` | Help center |
| Register | `/broker/register` | Broker registration |
| Login | `/broker/login` | Broker login |

#### Supplier Portal (`app/supplier/`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/supplier` | Supplier overview |
| Listings | `/supplier/listings` | Supplier product listings |
| Certificate | `/supplier/certificate` | Certificate management |
| Profile | `/supplier/profile` | Business profile |
| Help | `/supplier/help` | Help center |
| Register | `/supplier/register` | Supplier registration |
| Login | `/supplier/login` | Supplier login |

### Components

Reusable UI components in `frontend/src/components/`:

| Component | Description |
|-----------|-------------|
| `Navbar.tsx` | Main navigation bar with role-based menu items |
| `Footer.tsx` | Site-wide footer |
| `ListingCard.tsx` | Listing display card with images, price, and actions |
| `NotificationBell.tsx` | Real-time notification bell icon |
| `NotificationsPage.tsx` | Full notification list view |
| `StarRating.tsx` | Interactive star rating component |
| `WhatsAppButton.tsx` | WhatsApp contact button |
| `AuthRegisterLayout.tsx` | Shared auth/registration layout |
| `LegalPage.tsx` | Legal content page template |
| `BrokerCertificate.tsx` | Broker certificate display and download |
| `AmbassadorCertificate.tsx` | Ambassador certificate display and download |

### Contexts

React contexts in `frontend/src/context/`:

| Context | Description |
|---------|-------------|
| `AuthContext.tsx` | Global authentication state, login/logout, user role, JWT management |
| `LanguageContext.tsx` | Language switching (i18n) with translation support |
| `CurrencyContext.tsx` | Currency selection and formatting |

### Library Utilities

Helper modules in `frontend/src/lib/`:

| Module | Description |
|--------|-------------|
| `api.ts` | Axios instance with base URL and JWT interceptor |
| `socket.ts` | Socket.IO client connection for real-time events |
| `config.ts` | Application configuration constants |
| `colors.ts` | Theme color definitions |
| `currencies.ts` | Supported currencies and formatting helpers |
| `translations.ts` | Multi-language translation strings |
| `icons.tsx` | Custom icon components |
| `useUnreadCount.ts` | Custom hook for unread notification count |
| `ambassadorCertPrint.ts` | Ambassador certificate print/PDF generation |

---

## User Roles

The platform supports six distinct user roles, each with its own dashboard and permissions:

| Role | Description |
|------|-------------|
| **User** | Buyers who browse, like, rate, and comment on listings |
| **Seller** | Posts listings (products, rentals, auctions), manages subscriptions |
| **Broker** | Manages clients, leads, commissions, and client communications |
| **Ambassador** | Earns rewards through referrals and platform activities |
| **Supplier** | Business suppliers who list products in bulk |
| **Admin/Staff** | Full platform management, moderation, and configuration |

---

## Core Features

### Listings & Auctions

- Create listings with title, description, price, images, and category.
- Three listing types: **sell**, **rent**, and **auction**.
- Auction features: minimum increment, reserve price, anti-sniping protection, configurable sniping window, highest bid tracking.
- Listing statuses: active, expired, sold, deleted, disabled.
- Featured listings with configurable duration.
- Listing search and filtering by category, location, and price.
- 23 predefined categories across products, rental properties, rental vehicles, and services.
- View count tracking per listing.
- Listing renewal via tokens sent to seller phone.
- Configurable listing duration and pricing (3 days, 7 days, 30 days).

### Coin System & Payments

- Internal **coin currency** for platform transactions.
- Coin packages purchasable via **MTN Mobile Money (MoMo)**.
- Coins used for: listing fees, contact unlock fees, listing boost fees, subscription fees.
- Coin transaction history with types: purchase, listing_fee, connect_fee, refund, referral_bonus, boost_fee, subscription_fee.
- Promo codes for discounted coin purchases.
- Three subscription tiers: **free**, **standard**, **premium** — with different listing limits, durations, and feature access.

### Contact Access & Reveal

- **Contact Unlock** — sellers can reveal buyer contact information after payment.
- **Contact Access** — buyers can access seller phone numbers after OTP-verified payment.
- **Reveal** — general contact reveal flow with payment verification.
- OTP verification for secure contact access.
- Sale status tracking: pending, sold, rented.

### Certificates

Three certificate categories with configurable types and pricing:

- **Broker Certificates** — professional broker credentials.
- **Ambassador Certificates** — ambassador recognition credentials.
- **Supplier Certificates** — supplier business credentials.

Each certificate goes through: **pending** → **paid** → **generated** lifecycle.

Certificate types are fully configurable via admin panel with custom name, description, price (RWF), and duration.

### Notifications

- Real-time in-app notifications via **Socket.IO**.
- Notification types: info, warning, alert.
- Read/unread status tracking.
- Notification bell component with unread count.
- Notifications triggered by: listings, payments, certificates, system announcements.

### Referrals & Rewards

- Unique referral codes per user.
- Referral bonus coins for both referrer and referred user.
- Ambassador referral tracking and rewards.
- Referral leaderboard.

### Content Management

- CMS-managed content pages: pages, guides, FAQs, policies.
- Draft/publish workflow.
- Legal pages seeded via script (privacy, terms, etc.).
- Admin-editable platform content.

### Support & Reporting

- **Support Requests** — categorized tickets (payment, listing, access, other) with status tracking (pending, in_progress, resolved, closed).
- **Listing Reports** — abuse reporting with reasons (spam, inappropriate, scam, misleading, illegal, other) and admin review workflow.

### Announcements

- Platform-wide or audience-targeted announcements.
- Created by admin/staff.
- Published to all users, specific roles, or selected groups.

### Donations

- Accept donations via MTN MoMo or card.
- OTP-verified donation flow.
- Donor information tracking (name, email, phone, message).

### Ratings & Comments

- **Star Ratings** — 1-5 star rating per user per listing.
- **Threaded Comments** — nested comment system with parent-child relationships.

### Recycle Bin

- Soft-deleted listings stored in recycle bin.
- Admin can restore or permanently delete listings.

---

## Services Breakdown

### `emailService.js`
Sends transactional emails (verification, password reset, certificate confirmation) via Nodemailer using SMTP (configured for Gmail).

### `smsService.js`
Sends SMS notifications via Africa's Talking API for OTP codes, verification, and alerts.

### `momoService.js`
Integrates with MTN MoMo API for:
- Collection requests (buyer payments).
- Provisioning (payouts).
- Payment status verification.

### `s3Service.js`
Manages file storage with MinIO (S3-compatible):
- Bucket creation and health checks.
- Image upload/download for listing photos and certificate uploads.
- Public URL generation for image access.

### `notificationService.js`
Creates in-app notifications and pushes them to connected users via Socket.IO.

### `renewalScheduler.js`
Background job that checks for listings nearing expiration and triggers renewal reminders via SMS.

### `expiryScheduler.js`
Background job that automatically changes listing status to `expired` when past their `expires_at` timestamp.

### `auctionScheduler.js`
Background job that manages auction lifecycles: starts auctions at scheduled times, processes ending bids, and handles anti-sniping extensions.

### `brokerCommissionService.js`
Calculates and tracks commissions earned by brokers from their clients' transactions.

### `brokerLeadService.js`
Manages lead generation and tracking for brokers, linking potential clients to broker accounts.

---

## Docker Deployment

The platform is fully containerized via `docker-compose.yml`:

```bash
docker-compose up -d
```

### Services

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `mysql` | `mariadb:10.11` | `3307:3306` | Database |
| `minio` | `minio/minio` | `9000:9000`, `9001:9001` | Object storage (S3-compatible) |
| `backend` | Built from `./backend` | `5000:5000` | Express API server |
| `frontend` | Built from `./frontend` | `3000:3000` | Next.js web app |

### Volumes

- `mysql_data` — persistent database storage.
- `minio_data` — persistent file storage.

### Health Checks

All infrastructure services have health checks configured. Backend depends on MySQL and MinIO being healthy before starting.

---

## Local Development

### Prerequisites

- Node.js (v18+)
- MariaDB or MySQL running locally (or via Docker)
- MinIO running locally (or via Docker)

### Backend

```bash
cd backend
npm install
npm run dev       # Starts with nodemon on port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # Starts Next.js dev server on port 3000
```

### Database Setup

1. Create the `nmo_db` database.
2. Run `backend/src/config/schema.sql` to create all tables.
3. Run `node seed-admin.js` to create the default admin account.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | `rootpassword` |
| `DB_NAME` | Database name | `nmo_db` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `CLIENT_URL` | Allowed CORS origins | `http://localhost:3000` |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` |
| `SMTP_SECURE` | SMTP TLS | `true` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | Sender email address | — |
| `AT_API_KEY` | Africa's Talking API key | — |
| `AT_USERNAME` | Africa's Talking username | — |
| `AT_SENDER_ID` | SMS sender ID | `NMO` |
| `MOMO_SUBSCRIPTION_KEY` | MTN MoMo subscription key | — |
| `MOMO_USER_ID` | MTN MoMo user ID | — |
| `MOMO_API_KEY` | MTN MoMo API key | — |
| `MOMO_ENV` | MoMo environment | `production` |
| `MOMO_COLLECTION_BASE` | MoMo collection API URL | `https://proxy.momoapi.mtn.com` |
| `MOMO_PROVISION_BASE` | MoMo provision API URL | `https://proxy.momoapi.mtn.com` |
| `S3_ENDPOINT` | MinIO endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `S3_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `S3_BUCKET` | S3 bucket name | `nmo-images` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_PUBLIC_URL` | Public URL for images | `http://localhost:9000/nmo-images` |

### Frontend (`.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## Launch Scripts

Multiple convenience scripts are provided for starting the platform:

| Script | Purpose |
|--------|---------|
| `launch.bat` | Kills existing Node processes, starts backend on port 4000, frontend on port 3000, then checks ports |
| `launch-hidden.vbs` | Same as launch.bat but runs in background (no console window) |
| `start-all.ps1` | PowerShell script to start both services and report status |
| `start-all-v2.ps1` | Updated version of the start-all script |
| `restart-all.ps1` | Stops all Node processes and restarts both services |
| `start-backend.bat` | Starts only the backend server |
| `start-frontend.bat` | Starts only the frontend dev server |
| `start-servers.bat` | Starts both servers (BAT version) |
| `start-servers.ps1` | Starts both servers (PowerShell version) |

---

## Platform Settings

Configurable via the `platform_settings` table and admin panel:

| Setting | Description | Default |
|---------|-------------|---------|
| `posting_fee` | Coin cost to post a listing | `400` |
| `posting_free` | Allow free posting | `false` |
| `auction_anti_sniping` | Enable anti-sniping protection | `false` |
| `auction_sniping_window` | Anti-sniping extension window (seconds) | `30` |
| `auction_default_increment` | Minimum bid increment (RWF) | `500` |
| `listing_duration_3_days` | Cost for 3-day listing | `500` |
| `listing_duration_7_days` | Cost for 7-day listing | `1000` |
| `listing_duration_30_days` | Cost for 30-day listing | `3500` |

---

## Predefined Categories

23 listing categories across four types:

### Products
Electronics, Fashion, Furniture, Beauty & Health, Books, Handcraft, Food & Beverage, Clothing, Farmer Product

### Rental Properties
Houses & Apartments, Offices

### Rental Vehicles
Cars, Motorcycles

### Services
Transport Services, Technician Services, Mechanical Services, Gardening Services, Arts & Tourism, Jobs (Abasare), Construction, Health, Education, Supply Chain
