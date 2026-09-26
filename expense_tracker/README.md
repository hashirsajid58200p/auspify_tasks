# Expense Tracker & Wealth Intelligence

An editorial-grade, multi-tenant personal finance and wealth management platform engineered for precision, privacy, and speed. Built with **Next.js 16 (App Router)**, **TypeScript Strict**, **MongoDB Atlas**, **Mongoose**, **argon2id**, and **Tailwind CSS**.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0_Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-Aggregations-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_&_Integration-FCC72B?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](#license)

---

## ⚡ Live Demo Credentials

Explore the live platform with the pre-seeded interactive demonstration account containing 100+ historical transactions, active budget targets, and real-time financial intelligence heuristics:

| Credential | Value |
|---|---|
| **URL** | [http://localhost:3000](http://localhost:3000) (or your deployed Vercel host) |
| **Email** | `demo@auspify.com` |
| **Password** | `DemoUser1234!` |
| **Protection** | Destructive operations (`DELETE /api/account`, password changes) are safely locked for the demo account (`403 Forbidden`). |

---

## 🏗️ Architecture & Key Engineering Decisions

### 1. Integer Minor Units (Cents/Paise) for Currency
- **The Problem**: JavaScript IEEE 754 floating-point numbers cause catastrophic rounding errors in financial transactions (`0.1 + 0.2 === 0.30000000000000004`).
- **The Solution**: All currency values are stored, indexed, and aggregated strictly as **integer minor units** (e.g., `$42.50` = `4250` cents). Floating point is only applied at the final UI formatting layer via `Intl.NumberFormat`.

### 2. High-Performance MongoDB Aggregation Pipelines
- **The Problem**: Fetching thousands of transaction documents into the Node.js runtime to calculate monthly totals and category breakdowns burns CPU and memory.
- **The Solution**: Calculations are offloaded to **MongoDB aggregation pipelines** (`$facet`, `$group`, `$sum`). The database calculates net balances, monthly trend arrays, and category percentages in sub-10ms queries.

### 3. Self-Hosted Argon2id & Dual-Cookie JWT Architecture
- **The Problem**: Third-party auth providers (NextAuth, Clerk, Auth0) introduce vendor lock-in, recurring monthly SaaS costs, and opaque token revocation controls.
- **The Solution**: Custom auth engine combining **Argon2id** (`@node-rs/argon2`, $m=64\text{MB}, t=3, p=4$) with a dual-cookie JWT architecture:
  * Short-lived Access Token (15 min) in `httpOnly`, `SameSite=Lax` cookie.
  * Long-lived Refresh Token (7 days) in `httpOnly`, `SameSite=Strict` cookie.
  * **Refresh Token Rotation (RTR)** with Token Family tracking and replay detection: If a reused token is presented outside the grace window, the entire session family is revoked immediately.

### 4. TanStack Query v5 + Server State Synchronization
- **The Problem**: Stale client state and waterfall network requests when switching between pages.
- **The Solution**: Unified query keys with automatic cache invalidation (`invalidateQueries(['reports'])`, `invalidateQueries(['budgets'])`, `invalidateQueries(['transactions'])`) ensures that adding or deleting a transaction instantly updates dashboard totals, budget progress bars, and recent activity lists.

---

## 💻 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React Server Components, server actions, route handlers, modern streaming |
| **Language** | TypeScript Strict (`strict: true`) | Complete compile-time type safety with zero `any` leaks |
| **Styling** | Tailwind CSS + Lucide Icons | Fluid responsiveness, editorial design tokens, minimal runtime overhead |
| **Database & ODM** | MongoDB Atlas + Mongoose 9 | Serverless connection caching on `globalThis`, pool size $\le 5$ |
| **Validation** | Zod (`.strict()`) | Strict input sanitization rejecting extraneous or malicious fields |
| **State Management** | TanStack Query v5 | Automatic client-side caching, background refetching, mutation lifecycle |
| **Testing** | Vitest + `mongodb-memory-server` | Lightning-fast in-memory unit and integration tests (100% database parity) |

---

## 🌟 Key Features

### 📊 Real-Time Financial Intelligence & Reports
- **Executive Summary**: Monthly income, expenses, net savings, and real-time savings rate.
- **Category Breakdown**: Interactive category doughnut/progress distribution sorted by highest spend.
- **Monthly Trajectory**: 6-month comparative bar chart contrasting income vs. expenditure.
- **Automated Insights**: Heuristic engine surfacing month-over-month shifts, highest spending anomalies, budget threshold warnings, and savings health ratings.

### 💳 Complete Transaction Management
- Filter by date range (preset or custom), transaction type (`INCOME` / `EXPENSE`), category, and text search.
- Pagination with customizable page sizes (10, 25, 50, 100).
- Modals for creating and editing records with UTC midnight normalization.

### 🎯 Proactive Budget Targets
- Monthly budget limits mapped to specific expense categories.
- Real-time spend tracking with three distinct visual states:
  * **Normal** (< 80% limit): Clean neutral/slate indicator.
  * **Warning** (80% - 99% limit): Amber alert badge.
  * **Exceeded** ($\ge$ 100% limit): Rose destructive alert badge.

### 🔒 Enterprise-Grade Security
- **Strict Content Security Policy (CSP)** and security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- **CSV Formula Injection Defense**: Escapes spreadsheet formulas (`=`, `+`, `-`, `@`, `\t`, `\r`) during CSV export.
- **Tenant Isolation**: Every database operation requires `userId` as the first argument, enforced in `src/server/services/`.
- **Cascade Account Deletion**: Atomic multi-collection cleanup removing user, sessions, transactions, budgets, and custom categories.
- **Data Portability**: Full JSON export conforming to GDPR / CCPA right-to-access requirements.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or 22.x LTS
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB 6+)
- npm or pnpm

### 1. Clone & Install
```bash
git clone <repository-url> expense-tracker
cd expense-tracker
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/expense_tracker?retryWrites=true&w=majority

# Cryptographic JWT Secrets (minimum 32 characters)
JWT_ACCESS_SECRET=your-super-secret-access-token-key-minimum-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-minimum-32-chars

# Application URL
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 3. Seed Database
Seed the demo account and 100+ realistic transaction records:
```bash
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Suite

The project includes unit, service-layer, and end-to-end integration tests using Vitest and `mongodb-memory-server`:

```bash
# Run all unit & integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Run TypeScript compiler check
npm run typecheck

# Build for production
npm run build
```

---

## 📁 Project Structure

```
├── docs/                   # Engineering plans, design tokens, security threat model
│   ├── PLAN.md             # 7-day architectural blueprint and technical specification
│   ├── SECURITY.md         # Threat model, cryptographic primitives & disclosure policy
│   └── design-inventory.md # Design system tokens, color palettes & typography specs
├── public/                 # Static assets, favicon, manifest
├── src/
│   ├── app/                # Next.js App Router (pages and API endpoints)
│   │   ├── (app)/          # Protected application shell (dashboard, transactions, budgets, reports, settings)
│   │   ├── (auth)/         # Public authentication flows (login, register)
│   │   ├── api/            # REST API endpoints with http.ts wrapper
│   │   ├── page.tsx        # Brillance editorial fintech landing page
│   │   ├── privacy/        # Privacy policy
│   │   └── terms/          # Terms of service
│   ├── components/         # Modular React components
│   │   ├── auth/           # Login/register forms
│   │   ├── budgets/        # Budget cards, progress bars & dialogs
│   │   ├── dashboard/      # Metrics, trajectory charts & insight widgets
│   │   ├── layout/         # App shell, navigation sidebar & mobile nav
│   │   ├── reports/        # Category breakdowns, charts & export buttons
│   │   ├── transactions/   # Filterable data tables, modals & badges
│   │   └── ui/             # Radix & Tailwind design primitives
│   ├── hooks/              # Custom TanStack Query & state hooks
│   ├── lib/                # Utilities: money formatting, dates, CSV sanitizer
│   ├── server/             # Backend domain logic
│   │   ├── auth/           # Argon2id hashing, JWT sign/verify, cookies
│   │   ├── db.ts           # Mongoose cached connection singleton
│   │   ├── http.ts         # Route handler wrapper (auth, rate-limit, Zod strict)
│   │   ├── models/         # Mongoose schemas (User, Session, Transaction, Category, Budget)
│   │   └── services/       # Isolated domain services (all scoped by userId)
│   └── validations/        # Zod validation schemas
└── tests/                  # Vitest unit & integration test suites
    └── unit/               # Service isolation, tokens, argon2id, e2e lifecycle tests
```

---

## 📡 API Reference

All protected endpoints require an authenticated session via httpOnly cookies.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user & seed default categories |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Authenticate user & issue cookie pair |
| `POST` | `/api/auth/refresh` | Cookie | Rotate refresh token & issue new access token |
| `POST` | `/api/auth/logout` | Auth | Revoke current refresh token & clear cookies |
| `GET` | `/api/auth/me` | Auth | Return authenticated user identity & profile |
| `GET` | `/api/auth/sessions` | Auth | List all active sessions for current user |
| `DELETE` | `/api/auth/sessions/:id` | Auth | Revoke a specific session |
| `GET` | `/api/categories` | Auth | List user categories (system + custom) |
| `POST` | `/api/categories` | Auth | Create a custom category |
| `PATCH` | `/api/categories/:id` | Auth | Update category name, color, or icon |
| `DELETE` | `/api/categories/:id` | Auth | Delete custom category (prevents system deletion) |
| `GET` | `/api/transactions` | Auth | Paginated, filtered transaction query |
| `POST` | `/api/transactions` | Auth | Create new transaction |
| `GET` | `/api/transactions/:id` | Auth | Retrieve single transaction |
| `PATCH` | `/api/transactions/:id` | Auth | Update transaction fields |
| `DELETE` | `/api/transactions/:id` | Auth | Delete transaction |
| `GET` | `/api/budgets` | Auth | Get budgets for month with real-time spend progress |
| `PUT` | `/api/budgets` | Auth | Create or update category budget limit |
| `DELETE` | `/api/budgets/:id` | Auth | Delete budget limit |
| `GET` | `/api/reports/summary` | Auth | Summary metrics (income, expense, net, savings rate) |
| `GET` | `/api/reports/category` | Auth | Category spending breakdown with percentages |
| `GET` | `/api/reports/monthly` | Auth | 6-month comparative trajectory data |
| `GET` | `/api/reports/insights` | Auth | Automated financial intelligence heuristics |
| `GET` | `/api/reports/export` | Auth | Download sanitized CSV file of transactions |
| `GET` | `/api/account` | Auth | Fetch user account profile |
| `PATCH` | `/api/account` | Auth | Update name or preferred currency |
| `PATCH` | `/api/account/password` | Auth | Update password & revoke all other sessions |
| `GET` | `/api/account/export` | Auth | Export complete user data archive as JSON |
| `DELETE` | `/api/account` | Auth | Cascade delete user account and all linked records |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
