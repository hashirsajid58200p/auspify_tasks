# Student Management System (SMS)

A production-grade, internal web application designed for educational institutions, school administrators, and academic staff to manage student enrollments, class cohorts, homeroom assignments, and sensitive student records with rigorous privacy guarantees and role-based access control.

---

## 1. Key Features

- **Institutional Dashboard:** High-level metrics showing total student body, class capacities, overall seat utilization percentage, cohort distribution progress bars, and recent student enrollments.
- **Class & Homeroom Management:** Create, configure, update, and manage grade levels, student capacity limits, and assigned homeroom teachers.
  - _Data Integrity Blocker:_ Classes cannot be deleted while active or historical student records reference them.
- **Student Directory & Profiles:** Search, filter by class cohort, filter by enrollment status (`ACTIVE`, `INACTIVE`, `GRADUATED`, `TRANSFERRED`), sort by ID/name/date, and paginate up to 50 records per page.
  - _Responsive Layout:_ Displays as an interactive data table on desktop and fluid touch-friendly card stacks on mobile devices.
  - _Sensitive PII Isolation:_ Minors' personal information (Date of Birth, calculated age, home address, guardian contact details) is strictly hidden from list views and exposed only on authenticated detail profiles (`/students/[id]`).
- **Student Registration & Updates:** Form dialogs with real-time validation, unique immutable `studentId` enforcement, and optional HTTPS photo URLs from verified image hosts.
- **Typed Deletion Safeguard & Audit Logging:** Deleting a student record requires the operator to type the student ID or name to confirm, and creates an immutable `AuditLog` entry before removing the record.
- **Formula-Injection Safe CSV Export:** Download the currently filtered and sorted student list with formula execution protection (`=`, `+`, `-`, `@` escaped).
- **Staff Administration (Admin Only):** Gated to administrators to provision staff accounts with temporary passwords, manage roles, and suspend accounts.
  - _Self-Action Safeguard:_ Staff cannot self-promote, demote, or suspend themselves.
  - _Last Admin Protection:_ Prevents demoting or suspending the institution's last active administrator.
  - _Immediate Session Revocation:_ Suspending an account instantly terminates all active sessions across all devices.
- **First-Login Password Gate:** Newly provisioned staff accounts with temporary passwords are strictly gated to `/change-password` until they establish their own credentials.

---

## 2. Technology Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19, Server Components by default)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/) (Strict mode, zero `any`, zero unused variables)
- **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) primitives, [Lucide Icons](https://lucide.dev/), monochromatic slate/zinc design system with dark and light mode support
- **Database & ODM:** [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose 9](https://mongoosejs.com/) (strict schemas, cached connections, compound indexing, `sanitizeFilter` enabled)
- **Authentication & Security:** Custom dual-secret JWT authentication (`jose`), password hashing with Argon2id (`@node-rs/argon2`), httpOnly cookies with CSRF origin validation, and single-use session rotation with replay attack mitigation
- **Data Validation:** [Zod](https://zod.dev/) with `.strict()` parsing on all API bodies and query parameters
- **Client State:** [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **Testing:** [Vitest](https://vitest.dev/) with `mongodb-memory-server` for isolated unit & service tests; [Playwright](https://playwright.dev/) for end-to-end smoke testing

---

## 3. Architecture & Data Flow

```
[Browser Client]
       │
       ▼
[Next.js App Router (16.x)]
       │
       ├──► Middleware & HTTP Wrapper (`src/server/http.ts`)
       │       ├── Origin/CSRF Verification
       │       ├── Session & Access Token Verification (`requireUser()`)
       │       ├── Role Gating (`requireRole(ADMIN)`)
       │       ├── Sliding Window Rate Limiting (`RateLimit` collection)
       │       └── Strict Zod Schema Parsing (`.strict()`)
       │
       └──► Business Logic Service Layer (`src/server/services/*`)
               ├── No Direct Mongoose Calls in Components/Routes
               ├── Mongoose Models with Compound Indexes (`src/server/models/*`)
               ├── sanitizeFilter: true & mongoose.trusted() Query Defenses
               └── Pre-Action Audit Logging (`AuditLog` collection)
                       │
                       ▼
               [MongoDB Atlas Cluster]
```

---

## 4. Sensitive Minor PII Handling

Student records in an educational institution hold minors' personal information. This application implements strict confidentiality boundaries:

1. **Strict Information Hiding:** The student list API (`GET /api/students`) and search filters project only public academic attributes (`studentId`, `firstName`, `lastName`, `gender`, `classId`, `status`, `enrollmentDate`). Date of Birth, residential home address, phone, email, guardian name, guardian phone, and guardian email are never returned in list endpoints.
2. **Authenticated Detail View Only:** Sensitive PII is accessible strictly via `GET /api/students/[id]` on the individual student's detail page.
3. **No Search Engine Indexing:** `src/app/robots.ts` disallows crawler indexing across all routes (`Disallow: /`). All authenticated views include `noindex, nofollow` HTTP headers.
4. **Fictional Demo Content:** All seed and demonstration records use obviously fictional astronomical names (e.g. _Nova Starling_, _Alex Quasar_, _Jordan Eclipse_) with dummy phone numbers and internal domain emails. **No real person's personal information is stored or used anywhere.**

---

## 5. Demonstration Credentials

The application seed script provisions initial administrative and staff accounts:

| Role              | Email                      | Password               | Initial State                             |
| :---------------- | :------------------------- | :--------------------- | :---------------------------------------- |
| **Administrator** | `admin@studentms.internal` | `AdminStrongPass123!`  | Active, direct dashboard access           |
| **Staff Member**  | `staff@studentms.internal` | `StaffInitialPass123!` | Active, direct dashboard access           |

---

## 6. API Reference

All API routes require a valid authenticated session, except `/api/auth/login`, `/api/auth/refresh`, and `/api/health`. Responses follow the standard envelope shape: `{ data, meta? }` on success, `{ error: { code, message, fieldErrors? } }` on failure.

| Method       | Endpoint                | Access        | Purpose                                                        |
| :----------- | :---------------------- | :------------ | :------------------------------------------------------------- |
| `POST`       | `/api/auth/login`       | Public        | Authenticates credentials, creates session, issues cookies     |
| `GET`/`POST` | `/api/auth/refresh`     | Public        | Rotates single-use refresh token with replay detection         |
| `POST`       | `/api/auth/logout`      | Authenticated | Revokes current session and clears auth cookies                |
| `GET`        | `/api/auth/me`          | Authenticated | Returns current authenticated user and role profile            |
| `POST`       | `/api/account/password` | Authenticated | Updates password, clears `mustChangePassword` gate             |
| `GET`        | `/api/dashboard`        | Staff / Admin | Aggregated metrics: totals, utilization, class distribution    |
| `GET`        | `/api/classes`          | Staff / Admin | Lists classes with live enrolled and active student counts     |
| `POST`       | `/api/classes`          | Staff / Admin | Creates a new class cohort                                     |
| `PATCH`      | `/api/classes/[id]`     | Staff / Admin | Updates class details, capacity, and teacher                   |
| `DELETE`     | `/api/classes/[id]`     | Staff / Admin | Deletes class (blocked if any students are enrolled)           |
| `GET`        | `/api/students`         | Staff / Admin | Filtered, sorted, paginated student list (excludes PII)        |
| `POST`       | `/api/students`         | Staff / Admin | Registers a new student record                                 |
| `GET`        | `/api/students/[id]`    | Staff / Admin | Retrieves full student profile (including sensitive PII)       |
| `PATCH`      | `/api/students/[id]`    | Staff / Admin | Updates student profile fields (`studentId` immutable)         |
| `DELETE`     | `/api/students/[id]`    | Staff / Admin | Deletes student (writes `AuditLog` entry before deletion)      |
| `GET`        | `/api/admin/staff`      | Admin Only    | Lists staff users (omits password hashes)                      |
| `POST`       | `/api/admin/staff`      | Admin Only    | Provisions new staff account with temporary password           |
| `PATCH`      | `/api/admin/staff/[id]` | Admin Only    | Modifies staff role or status (revokes sessions on suspension) |
| `GET`        | `/api/health`           | Public        | Health probe returning `{ status, db }`                        |

---

## 7. Local Setup & Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- A MongoDB Atlas cluster (or local MongoDB 6.0+)

### 1. Clone & Install Dependencies

```bash
git clone <repo-url> student-management-system
cd student-management-system
npm install
```

### 2. Environment Variables

Create `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

Configure your secrets:

```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=studentms

# Dual JWT Secrets (Generate with: openssl rand -base64 48)
JWT_ACCESS_SECRET=your-48-character-base64-access-secret
JWT_REFRESH_SECRET=your-48-character-base64-refresh-secret

# Seed Administrator
SEED_ADMIN_EMAIL=admin@studentms.internal
SEED_ADMIN_PASSWORD=AdminStrongPass123!
```

### 3. Verify Database Connectivity & Sync Indexes

```bash
npm run db:check
npm run db:sync-indexes
```

### 4. Seed Initial Data

```bash
npm run db:seed
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Verification & Testing

### Run Vitest Unit & Service Tests

Executes 43 automated unit tests against in-memory MongoDB:

```bash
npm test
```

### Run Playwright End-to-End Smoke Test

Executes the full end-to-end admin workflow (login -> class creation -> student registration -> search/filter -> edit profile -> typed delete confirmation with audit log -> class cleanup):

```bash
npm run test:e2e
```

### Run Code Quality & Type Checks

```bash
npm run lint          # ESLint 9 checks
npm run typecheck     # TypeScript strict compilation
npm run format:check  # Prettier formatting verification
npm run build         # Next.js 16 production build
npm audit --omit=dev  # Production vulnerability audit
```

---

## 9. Visual Screenshots

Captured full-page screenshots for both desktop (1440px) and mobile (390px) viewports are available in `docs/screenshots/`:

| Screen                   | Desktop (1440px)                                   | Mobile (390px)                                    |
| :----------------------- | :------------------------------------------------- | :------------------------------------------------ |
| **Login**                | `docs/screenshots/01-login-desktop.png`            | `docs/screenshots/01-login-mobile.png`            |
| **Dashboard**            | `docs/screenshots/02-dashboard-desktop.png`        | `docs/screenshots/02-dashboard-mobile.png`        |
| **Classes**              | `docs/screenshots/03-classes-desktop.png`          | `docs/screenshots/03-classes-mobile.png`          |
| **Students Directory**   | `docs/screenshots/04-students-list-desktop.png`    | `docs/screenshots/04-students-list-mobile.png`    |
| **Student Detail & PII** | `docs/screenshots/05-student-detail-desktop.png`   | `docs/screenshots/05-student-detail-mobile.png`   |
| **Staff Administration** | `docs/screenshots/06-staff-management-desktop.png` | `docs/screenshots/06-staff-management-mobile.png` |
| **Account Settings**     | `docs/screenshots/07-settings-desktop.png`         | `docs/screenshots/07-settings-mobile.png`         |

---

## 10. Deliberate Omissions & Design Tradeoffs

1. **No Public Registration:** Self-registration is deliberately omitted to prevent unauthorized accounts on an internal institutional system. All accounts are provisioned by an administrator.
2. **No Direct File Uploads:** To eliminate risks associated with malicious file uploads (e.g. executable script uploads or storage exhaustion), student photos are provided via verified HTTPS URLs from allowlisted image domains.
3. **Per-Request Database Auth Check:** Rather than relying exclusively on stateless JWT claims, `requireUser()` verifies the user's role and active status in MongoDB on every request, ensuring immediate revocation when accounts are suspended.
4. **Immutable Student Identifiers:** Student ID numbers cannot be edited after creation to maintain permanent audit trails and prevent duplicate ID conflicts.
