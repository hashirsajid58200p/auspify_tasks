import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { hashPassword } from "../src/server/auth/password";
import { User, UserRole, UserStatus } from "../src/server/models/user";
import { Category } from "../src/server/models/category";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const CATEGORIES = [
  { name: "Web Development", slug: "web-development" },
  { name: "Full Stack Engineering", slug: "full-stack-engineering" },
  { name: "Mobile Development", slug: "mobile-development" },
  { name: "Cloud & DevOps", slug: "cloud-devops" },
  { name: "UI/UX Design", slug: "ui-ux-design" },
  { name: "Data Science & AI", slug: "data-science-ai" },
];

async function seed() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "lms";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@lms.local").toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!uri) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  if (!adminPassword) {
    console.error("Missing SEED_ADMIN_PASSWORD in environment. Admin password must be provided via env.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 8000,
  });
  console.log(`Connected to database "${dbName}".`);

  // 1. Seed Categories (Idempotent)
  console.log("\n--- Seeding Categories ---");
  for (const cat of CATEGORIES) {
    const result = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, returnDocument: "after" }
    );
    console.log(`Category: "${result.name}" (${result.slug}) ready.`);
  }

  // 2. Hash Passwords
  console.log("\n--- Preparing User Accounts ---");
  const adminPasswordHash = await hashPassword(adminPassword);
  const instructorPasswordHash = await hashPassword("InstructorDemo123!");
  const studentPasswordHash = await hashPassword("StudentDemo123!");

  const usersToSeed = [
    {
      name: "Platform Administrator",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN" as UserRole,
      status: "ACTIVE" as UserStatus,
      bio: "Root system administrator overseeing platform governance and moderation.",
      isDemo: false,
    },
    {
      name: "Sarah Jenkins",
      email: "instructor@lms.local",
      passwordHash: instructorPasswordHash,
      role: "INSTRUCTOR" as UserRole,
      status: "ACTIVE" as UserStatus,
      bio: "Senior Full-Stack Engineer and course instructor with 10+ years of distributed systems experience.",
      isDemo: true,
    },
    {
      name: "Alex Morgan",
      email: "student@lms.local",
      passwordHash: studentPasswordHash,
      role: "STUDENT" as UserRole,
      status: "ACTIVE" as UserStatus,
      bio: "Software engineering student focused on modern web platforms and cloud infrastructure.",
      isDemo: true,
    },
  ];

  // 3. Seed Users (Idempotent)
  for (const user of usersToSeed) {
    const existing = await User.findOne({ email: user.email });
    if (existing) {
      existing.name = user.name;
      existing.passwordHash = user.passwordHash;
      existing.role = user.role;
      existing.status = user.status;
      existing.bio = user.bio;
      existing.isDemo = user.isDemo;
      await existing.save();
      console.log(`User: ${user.name} (${user.email}) [${user.role}] updated.`);
    } else {
      await User.create(user);
      console.log(`User: ${user.name} (${user.email}) [${user.role}] created.`);
    }
  }

  // 4. Seed Published Demo Courses (Idempotent)
  console.log("\n--- Seeding Demo Courses & Curriculum ---");
  const instructor = await User.findOne({ email: "instructor@lms.local" });
  const student = await User.findOne({ email: "student@lms.local" });
  const fullstackCat = await Category.findOne({ slug: "full-stack-engineering" });
  const devopsCat = await Category.findOne({ slug: "cloud-devops" });

  if (instructor && fullstackCat && devopsCat) {
    const { Course } = await import("../src/server/models/course");
    const { Module } = await import("../src/server/models/module");
    const { Lesson } = await import("../src/server/models/lesson");
    const { Enrollment } = await import("../src/server/models/enrollment");
    const { LessonProgress } = await import("../src/server/models/lesson-progress");

    // Course 1: Full-Stack
    let course1 = await Course.findOne({ slug: "production-nextjs-fullstack-architecture" });
    if (!course1) {
      course1 = await Course.create({
        instructorId: instructor._id,
        title: "Production Next.js & Full-Stack Architecture",
        slug: "production-nextjs-fullstack-architecture",
        summary:
          "Build high-performance, full-stack web applications with Next.js 16 App Router, TypeScript, and modern state architectures.",
        description: `## About This Course

Master production-grade full-stack engineering with modern Next.js. You will build resilient applications backed by MongoDB, strict validation, and airtight authentication.

### What you will learn
- Next.js 16 App Router & Server Components
- Strict TypeScript design patterns
- Custom JWT auth rotation and argon2id password hashing
- Layered policy-based access control
- Zero mock data architectures
`,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
        categoryId: fullstackCat._id,
        level: "INTERMEDIATE",
        status: "PUBLISHED",
        lessonCount: 4,
        enrollmentCount: 1,
        publishedAt: new Date(),
      });
      console.log(`Course: "${course1.title}" created.`);
    }

    // Modules & Lessons for Course 1
    let mod1 = await Module.findOne({ courseId: course1._id, order: 0 });
    if (!mod1) {
      mod1 = await Module.create({
        courseId: course1._id,
        title: "Module 1: Foundations & Routing",
        order: 0,
      });

      const l1 = await Lesson.create({
        courseId: course1._id,
        moduleId: mod1._id,
        title: "Architecture & App Router Fundamentals",
        order: 0,
        type: "VIDEO",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        content: `### Architecture Fundamentals
In this introductory lesson, we explore how Next.js 16 App Router decouples data fetching from client bundle rendering.

Key takeaways:
- **Server Components by default**: zero client bundle overhead for static markup.
- **Client boundaries**: selective interactivity using \`"use client"\`.
- **Nested layouts**: persistent navigation state across route segments.`,
        durationMin: 15,
        isPreview: true,
      });

      await Lesson.create({
        courseId: course1._id,
        moduleId: mod1._id,
        title: "Server Components & Data Fetching Patterns",
        order: 1,
        type: "TEXT",
        content: `### Data Fetching in Server Components
Learn to interact directly with databases from Server Components without exposing internal API routes.

\`\`\`typescript
export async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return <CourseDetailView course={course} />;
}
\`\`\`

Always validate incoming parameters and handle not-found boundaries gracefully.`,
        durationMin: 25,
        isPreview: false,
      });

      // Seed student enrollment & lesson 1 progress
      if (student) {
        await Enrollment.findOneAndUpdate(
          { userId: student._id, courseId: course1._id },
          {
            userId: student._id,
            courseId: course1._id,
            status: "ACTIVE",
            progressPct: 25,
            lastLessonId: l1._id,
            lastAccessedAt: new Date(),
          },
          { upsert: true }
        );

        await LessonProgress.findOneAndUpdate(
          { userId: student._id, lessonId: l1._id },
          {
            userId: student._id,
            courseId: course1._id,
            lessonId: l1._id,
            completedAt: new Date(),
          },
          { upsert: true }
        );
        console.log(`Demo student enrolled in Course 1 with 25% progress.`);
      }
    }

    let mod2 = await Module.findOne({ courseId: course1._id, order: 1 });
    if (!mod2) {
      mod2 = await Module.create({
        courseId: course1._id,
        title: "Module 2: Security & Authorization",
        order: 1,
      });

      await Lesson.create({
        courseId: course1._id,
        moduleId: mod2._id,
        title: "JWT Session Rotation & Argon2id Hashing",
        order: 0,
        type: "TEXT",
        content: `### Cryptographic Security Practices
Implement industry-standard authentication using argon2id for password hashing and dual-token rotation with family reuse detection.

- **Argon2id**: Memory-hard key derivation resistant to GPU/ASIC cracking.
- **Access Tokens**: Short-lived (15 min) JWTs stored in httpOnly cookies.
- **Refresh Tokens**: 7-day tokens rotated on every refresh request.`,
        durationMin: 30,
        isPreview: false,
      });

      await Lesson.create({
        courseId: course1._id,
        moduleId: mod2._id,
        title: "Policy-Based Access Control & RBAC",
        order: 1,
        type: "VIDEO",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        content: `### Access Control Patterns
Every resource check must be centralized in dedicated policy functions rather than ad-hoc inline statements.`,
        durationMin: 20,
        isPreview: false,
      });
    }

    // Course 2: Cloud & DevOps
    let course2 = await Course.findOne({ slug: "cloud-infrastructure-microservices" });
    if (!course2) {
      course2 = await Course.create({
        instructorId: instructor._id,
        title: "Cloud Infrastructure & Microservices",
        slug: "cloud-infrastructure-microservices",
        summary:
          "Design resilient distributed backend architectures with Docker, Kubernetes, message queues, and zero-trust security.",
        description: `## Master Cloud Native Engineering

Deep dive into production cloud operations, container orchestration, and zero-trust network architectures.
`,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
        categoryId: devopsCat._id,
        level: "ADVANCED",
        status: "PUBLISHED",
        lessonCount: 2,
        enrollmentCount: 0,
        publishedAt: new Date(),
      });

      const devopsMod = await Module.create({
        courseId: course2._id,
        title: "Module 1: Container Orchestration",
        order: 0,
      });

      await Lesson.create({
        courseId: course2._id,
        moduleId: devopsMod._id,
        title: "Docker Multi-stage Builds & Security",
        order: 0,
        type: "VIDEO",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        content: `### Multi-stage Container Builds
Optimize container images for minimal footprint and maximum security.`,
        durationMin: 18,
        isPreview: true,
      });

      await Lesson.create({
        courseId: course2._id,
        moduleId: devopsMod._id,
        title: "Kubernetes Cluster Topology & Ingress",
        order: 1,
        type: "TEXT",
        content: `### Production Kubernetes Patterns
Cluster architecture, ingress controllers, and network policies.`,
        durationMin: 35,
        isPreview: false,
      });

      console.log(`Course: "${course2.title}" created with 2 lessons.`);
    }
  }

  console.log("\nSeed completed successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Seed error:", err);
  await mongoose.disconnect();
  process.exit(1);
});

