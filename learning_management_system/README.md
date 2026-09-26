# Enterprise Learning Management System (LMS)

A production-grade, full-stack Learning Management System built with **Next.js 16 (App Router)**, **React 19**, **TypeScript (Strict Mode)**, **Tailwind CSS v4**, **shadcn/ui**, **MongoDB Atlas (Mongoose)**, **custom dual-secret JWT authentication**, and **TanStack Query**.

Designed with strict zero-mock data principles, defense-in-depth security policies, server-authoritative assessment scoring, and automated certificate issuance.

---

## 🌟 Key Features

### 🎓 Student Experience
- **Catalog & Discovery:** Filter by category, search by keywords, view comprehensive course syllabi, instructor bios, and learning objectives.
- **Interactive Classroom:** Fluid player supporting YouTube/Vimeo embeds and sanitized rich markdown reading modules.
- **Secure Assessments:** Timed quizzes with server-enforced countdowns, randomized questions, and zero-leak answer evaluations.
- **Assignment Submissions:** Rich text notes and external repository/demo links with automated deadline and late-submission tracking.
- **Progress & Gradebook:** Live recalculation of curriculum completion percentages, letter grades (A–F), and cumulative earned points.
- **Verifiable Certificates:** Auto-generated idempotent digital credentials with unique `EDU-XXXXXXXX` codes and public verification links.

### 🛠️ Instructor Studio
- **Curriculum Builder:** Create, organize, and reorder modules, video lectures, and markdown reading materials.
- **Quiz & Assessment Authoring:** Multi-question quiz builder with passing thresholds, configurable time limits, and explanation notes.
- **Assignment Management:** Set due dates, submission requirements, and late-submission policies.
- **Grading Queue:** Review student submissions, assign numerical scores, and provide actionable pedagogical feedback.
- **Instructor Dashboard:** Real-time analytics tracking active students, total enrollments, submission queues, and completion rates.

### 🛡️ Admin Command Center
- **User Governance:** Search and filter users by role and status; update roles (`STUDENT`, `INSTRUCTOR`, `ADMIN`) or suspend compromised accounts.
- **Course Moderation:** Review course draft submissions, publish approved content to the public catalog, or unpublish courses.
- **Audit Logging:** Append-only audit trail logging security-critical events (role upgrades, suspensions, course status updates).

### 🔒 Enterprise Security
- Comprehensive security architecture documented in [`docs/SECURITY.md`](docs/SECURITY.md).
- **Argon2id Hashing:** Industry-standard password hashing with memory and parallelism cost parameters.
- **Dual-Secret JWT Authentication:** Ephemeral access tokens (15m) paired with rotating refresh tokens (7d) featuring reuse detection and database verification on every request.
- **Anti-Enumeration Access Control:** Forbidden/unauthorized resources return `404 Not Found` rather than `403 Forbidden` to prevent object identifier enumeration.
- **Server-Authoritative Evaluation:** Quiz answers are never exposed to the client; all timer expirations and scoring logic are strictly executed server-side.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.3+ (App Router, Server Components by default, React 19) |
| **Language** | TypeScript 5.7+ (Strict mode enabled, zero `any`) |
| **Styling & UI** | Tailwind CSS v4, shadcn/ui primitives, Radix UI, Lucide Icons |
| **State & Data Fetching** | TanStack React Query v5, Native React Server Components |
| **Database & ODM** | MongoDB Atlas via Mongoose 9 (strict schemas, cached connection pooling) |
| **Authentication** | Custom JWT via `jose`, Argon2id via `@node-rs/argon2`, `httpOnly` secure cookies |
| **Validation** | Zod 3.24+ with `.strict()` parsing on all incoming API requests |
| **Testing** | Vitest 3.x with `mongodb-memory-server` for isolated in-memory unit/policy/integration testing |

---

## 📂 Project Structure

```
├── docs/                      # Architectural & security documentation
│   └── SECURITY.md            # Detailed security model & threat mitigation
├── memory-bank/               # Project state & context tracking
│   ├── activeContext.md       # Current operational focus & decisions
│   ├── progress.md            # Feature completion matrix
│   └── projectbrief.md        # Core requirements & data mapping
├── scripts/                   # Database maintenance & seeding scripts
│   ├── check-db.ts            # DB connectivity verification
│   ├── seed.ts                # Production database seed script
│   └── sync-indexes.ts        # Mongoose schema index synchronizer
├── src/
│   ├── app/                   # Next.js App Router route groups
│   │   ├── (admin)/           # Admin dashboard, user governance, audit trail
│   │   ├── (auth)/            # Login, registration, role selection
│   │   ├── (instructor)/      # Instructor studio, course editor, grading queue
│   │   ├── (marketing)/       # Landing page, public features, marketing copy
│   │   ├── (public)/          # Course catalog, course details, certificate verification
│   │   ├── (student)/         # Student dashboard, active courses, gradebook, certificates
│   │   └── api/               # Secure RESTful API route handlers
│   ├── components/            # Reusable UI & domain-specific components
│   │   ├── auth/              # Auth forms and session providers
│   │   ├── course/            # Course cards, syllabi, enroll buttons
│   │   ├── curriculum/        # Module, lesson, quiz, and assignment editors
│   │   ├── layout/            # Navigation bars, footers, role-specific sidebars
│   │   ├── learn/             # Video player, markdown viewer, quiz taker, submission form
│   │   └── ui/                # shadcn/ui design system primitives
│   ├── lib/                   # Shared client and server utilities
│   │   ├── api-client.ts      # Fetch wrapper with automatic token refresh
│   │   ├── env.ts             # Runtime environment variable validation
│   │   ├── markdown.ts        # Markdown parser with HTML sanitization
│   │   └── video.ts           # Safe video URL parser (YouTube/Vimeo)
│   └── server/                # Backend domain logic
│       ├── auth/              # JWT issuance, password verification, cookie helpers
│       ├── db/                # Mongoose connection pooling & client lifecycle
│       ├── http.ts            # Standardized route handler with rate-limiting & error envelope
│       ├── models/            # Mongoose models & compound indexes
│       ├── policies/          # Role-based access control matrix & ownership guards
│       └── services/          # Core transactional business logic
└── tests/                     # Automated test suites
    ├── integration/           # End-to-end multi-role lifecycle smoke tests
    ├── policies/              # Policy matrix and permission boundary tests
    └── unit/                  # Service, token, password, and curriculum unit tests
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** `v20.x` or later (LTS recommended)
- **Package Manager:** `npm` (v10+)
- **MongoDB:** MongoDB Atlas cluster or a running local instance (`mongodb://localhost:27017/lms`)

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd learning_management_system
npm install
```

### 2. Environment Configuration

Create a `.env.local` file by copying the provided `.env.example`:

```bash
cp .env.example .env.local
```

Configure the environment variables in `.env.local`:

```env
# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Connection (MongoDB Atlas or Local)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
MONGODB_DB=lms

# Authentication Secrets (Generate with `openssl rand -base64 48`)
JWT_ACCESS_SECRET=your-32-character-or-longer-access-secret-here
JWT_REFRESH_SECRET=your-32-character-or-longer-refresh-secret-here

# Seed Credentials
SEED_ADMIN_EMAIL=admin@lms.local
SEED_ADMIN_PASSWORD=SuperSecretAdminPassword123!
```

### 3. Database Seeding

Populate the database with default categories, demo courses, curriculum items, and verified multi-role accounts:

```bash
npm run db:seed
```

#### Seeded Accounts & Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@lms.local` | Set via `SEED_ADMIN_PASSWORD` in `.env.local` |
| **Instructor** | `instructor@lms.local` | `InstructorDemo123!` |
| **Student** | `student@lms.local` | `StudentDemo123!` |

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

The test suite runs against an isolated, in-memory MongoDB server (`mongodb-memory-server`), ensuring zero impact on your production database.

```bash
# Run all unit, policy, and integration test suites
npm run test

# Type checking
npm run typecheck

# Code quality & ESLint verification
npm run lint

# Production compilation
npm run build
```

---

## 📜 Available NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server on port 3000 |
| `npm run build` | Compiles and builds production-optimized Next.js bundle |
| `npm run start` | Runs the compiled Next.js production server |
| `npm run test` | Executes 21 Vitest test suites (109 unit, policy, and integration tests) |
| `npm run lint` | Runs ESLint 9 checks across all source files |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm run db:seed` | Populates database with categories, courses, and demo users |
| `npm run db:check` | Verifies active connectivity to MongoDB Atlas |
| `npm run db:sync-indexes` | Synchronizes compound indexes on all Mongoose collections |

---

## 📄 License

This project is licensed under the MIT License.
