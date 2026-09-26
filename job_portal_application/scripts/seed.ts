import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { hashPassword } from "../src/server/auth/password";
import { User } from "../src/server/models/user";
import { Category } from "../src/server/models/category";
import { Company } from "../src/server/models/company";
import { SeekerProfile } from "../src/server/models/seeker-profile";
import { Job } from "../src/server/models/job";

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
  {
    name: "Engineering & Software",
    slug: "engineering",
    description: "Software development, DevOps, QA, and systems engineering.",
  },
  {
    name: "Design & Creative",
    slug: "design",
    description: "UI/UX design, visual design, animation, and brand design.",
  },
  {
    name: "Product & Project",
    slug: "product",
    description: "Product management, scrum master, and technical program management.",
  },
  {
    name: "Marketing & Growth",
    slug: "marketing",
    description: "Growth marketing, content strategy, performance ads, and SEO.",
  },
  {
    name: "Data Science & AI",
    slug: "data-ai",
    description: "Machine learning, AI research, data engineering, and business analytics.",
  },
  {
    name: "Operations & Support",
    slug: "operations",
    description: "Customer success, platform operations, and business administration.",
  },
];

async function seed() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "jobportal";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@jobportal.local").toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminJobPortal123!";

  if (!uri) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  console.log(`Connecting to MongoDB Atlas (${dbName})...`);
  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 8000,
  });

  console.log("Connected successfully. Seeding initial platform data...");

  // 1. Categories
  const categoryMap = new Map<string, any>();
  for (const cat of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: { name: cat.name, slug: cat.slug, description: cat.description } },
      { upsert: true, returnDocument: "after" },
    );
    categoryMap.set(cat.slug, doc);
  }
  console.log(`✓ Seeded ${CATEGORIES.length} job categories`);

  // 2. Platform Admin Accounts
  const adminPasswordHash = await hashPassword(adminPassword);
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: "Platform Administrator",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        status: "ACTIVE",
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const demoAdminPasswordHash = await hashPassword("DemoPassword123!");
  await User.findOneAndUpdate(
    { email: "admin@demo.local" },
    {
      $set: {
        name: "Admin Demo",
        email: "admin@demo.local",
        passwordHash: demoAdminPasswordHash,
        role: "ADMIN",
        status: "ACTIVE",
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  console.log(`✓ Seeded Admin accounts: ${adminEmail} & admin@demo.local`);

  // 3. Demo Employers & Companies
  const employerPasswordHash = await hashPassword("Employer123!");
  const demoEmployerPasswordHash = await hashPassword("DemoPassword123!");

  const employer1 = await User.findOneAndUpdate(
    { email: "employer@techcorp.local" },
    {
      $set: {
        name: "Sarah Connor",
        email: "employer@techcorp.local",
        passwordHash: employerPasswordHash,
        role: "EMPLOYER",
        status: "ACTIVE",
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const company1 = await Company.findOneAndUpdate(
    { ownerId: employer1._id },
    {
      $set: {
        ownerId: employer1._id,
        name: "TechCorp Labs",
        slug: "techcorp-labs",
        website: "https://techcorp.example.com",
        description:
          "Next-generation engineering and AI product studio building resilient distributed cloud applications.",
        location: "San Francisco, CA",
        industry: "Software & Technology",
        size: "51-200",
        logoUrl: "https://dummyimage.com/120x120/000/fff&text=TC",
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const employerDemo = await User.findOneAndUpdate(
    { email: "employer@demo.local" },
    {
      $set: {
        name: "Elena Rostova",
        email: "employer@demo.local",
        passwordHash: demoEmployerPasswordHash,
        role: "EMPLOYER",
        status: "ACTIVE",
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const companyDemo = await Company.findOneAndUpdate(
    { ownerId: employerDemo._id },
    {
      $set: {
        ownerId: employerDemo._id,
        name: "Vortex Systems",
        slug: "vortex-systems",
        website: "https://vortex.example.com",
        description:
          "High-frequency fintech infrastructure and distributed cloud orchestration platform.",
        location: "New York, NY",
        industry: "Fintech & Cloud",
        size: "201-500",
        logoUrl: "https://dummyimage.com/120x120/000/fff&text=VS",
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  console.log(`✓ Seeded Demo Employers: employer@techcorp.local & employer@demo.local`);

  // 4. Demo Seekers & Profiles
  const seekerPasswordHash = await hashPassword("Seeker123!");
  const demoSeekerPasswordHash = await hashPassword("DemoPassword123!");

  const seeker1 = await User.findOneAndUpdate(
    { email: "seeker@talent.local" },
    {
      $set: {
        name: "Alex Rivera",
        email: "seeker@talent.local",
        passwordHash: seekerPasswordHash,
        role: "JOB_SEEKER",
        status: "ACTIVE",
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  await SeekerProfile.findOneAndUpdate(
    { userId: seeker1._id },
    {
      $set: {
        userId: seeker1._id,
        headline: "Senior Full-Stack Engineer & Cloud Architect",
        bio: "Specializing in React 19, Next.js App Router, TypeScript, high-throughput microservices, and distributed systems.",
        skills: ["TypeScript", "Next.js", "React", "Node.js", "MongoDB", "PostgreSQL", "Docker"],
        experienceYears: 6,
        location: "New York, NY",
        links: {
          github: "https://github.com",
          linkedin: "https://linkedin.com",
          portfolio: "https://alexrivera.example.com",
        },
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const seekerDemo = await User.findOneAndUpdate(
    { email: "seeker@demo.local" },
    {
      $set: {
        name: "Jordan Lee",
        email: "seeker@demo.local",
        passwordHash: demoSeekerPasswordHash,
        role: "JOB_SEEKER",
        status: "ACTIVE",
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  await SeekerProfile.findOneAndUpdate(
    { userId: seekerDemo._id },
    {
      $set: {
        userId: seekerDemo._id,
        headline: "Principal Systems Architect & Distributed Systems Specialist",
        bio: "Passionate about event-driven architectures, low latency messaging, and resilient database replication.",
        skills: ["Go", "Rust", "TypeScript", "Kubernetes", "MongoDB", "PostgreSQL", "Kafka"],
        experienceYears: 8,
        location: "San Francisco, CA",
        links: {
          github: "https://github.com",
          linkedin: "https://linkedin.com",
          portfolio: "https://jordanlee.example.com",
        },
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  console.log(`✓ Seeded Demo Seekers: seeker@talent.local & seeker@demo.local`);

  // 5. Seed Real Published Job Postings
  const engineeringCat = categoryMap.get("engineering")?._id;
  const designCat = categoryMap.get("design")?._id;
  const productCat = categoryMap.get("product")?._id;
  const dataCat = categoryMap.get("data-ai")?._id;

  const sampleJobs = [
    {
      employerId: employer1._id,
      companyId: company1._id,
      title: "Senior Full-Stack TypeScript Engineer",
      slug: "senior-full-stack-typescript-engineer-techcorp",
      categoryId: engineeringCat,
      type: "FULL_TIME",
      locationType: "REMOTE",
      location: "Remote - North America / EU",
      experienceLevel: "SENIOR",
      skills: ["TypeScript", "Next.js", "React", "Node.js", "MongoDB"],
      salaryMin: 130000,
      salaryMax: 175000,
      salaryCurrency: "USD",
      status: "PUBLISHED",
      publishedAt: new Date(),
      description:
        "We are seeking an experienced Full-Stack TypeScript Engineer to scale our core web architecture. You will spearhead our transition to Next.js 16 Server Components, craft robust server endpoints, and collaborate closely with our product design team.",
    },
    {
      employerId: employer1._id,
      companyId: company1._id,
      title: "Staff Machine Learning Engineer",
      slug: "staff-machine-learning-engineer-techcorp",
      categoryId: dataCat,
      type: "FULL_TIME",
      locationType: "HYBRID",
      location: "San Francisco, CA",
      experienceLevel: "LEAD",
      skills: ["Python", "PyTorch", "LLMs", "Distributed Training", "CUDA"],
      salaryMin: 180000,
      salaryMax: 240000,
      salaryCurrency: "USD",
      status: "PUBLISHED",
      publishedAt: new Date(),
      description:
        "Join our Applied AI research team building high-performance inference pipelines and specialized domain models. Experience with parameter-efficient fine-tuning and high-scale embeddings is required.",
    },
    {
      employerId: employerDemo._id,
      companyId: companyDemo._id,
      title: "Lead Product Designer (Neo-Brutalist Systems)",
      slug: "lead-product-designer-vortex",
      categoryId: designCat,
      type: "FULL_TIME",
      locationType: "REMOTE",
      location: "Remote - Global",
      experienceLevel: "LEAD",
      skills: ["Figma", "Design Systems", "UI/UX", "Tailwind CSS", "Prototyping"],
      salaryMin: 125000,
      salaryMax: 165000,
      salaryCurrency: "USD",
      status: "PUBLISHED",
      publishedAt: new Date(),
      description:
        "Vortex Systems is redefining institutional financial tools with bold, ultra-usable neo-brutalist interfaces. We are looking for a visionary Lead Product Designer to guide our design tokens, component library, and candidate experiences.",
    },
    {
      employerId: employerDemo._id,
      companyId: companyDemo._id,
      title: "Principal Distributed Systems Architect",
      slug: "principal-distributed-systems-architect-vortex",
      categoryId: engineeringCat,
      type: "FULL_TIME",
      locationType: "ONSITE",
      location: "New York, NY",
      experienceLevel: "EXECUTIVE",
      skills: ["Go", "Distributed Systems", "Raft", "PostgreSQL", "Kafka"],
      salaryMin: 210000,
      salaryMax: 290000,
      salaryCurrency: "USD",
      status: "PUBLISHED",
      publishedAt: new Date(),
      description:
        "Architect mission-critical high-frequency transaction engines with sub-millisecond execution. Lead architectural trade-off analyses, fault-tolerance drills, and multi-region consensus protocols.",
    },
    {
      employerId: employerDemo._id,
      companyId: companyDemo._id,
      title: "Senior Technical Product Manager",
      slug: "senior-technical-product-manager-vortex",
      categoryId: productCat,
      type: "FULL_TIME",
      locationType: "HYBRID",
      location: "New York, NY",
      experienceLevel: "SENIOR",
      skills: ["Product Management", "Roadmapping", "APIs", "Agile", "Analytics"],
      salaryMin: 140000,
      salaryMax: 185000,
      salaryCurrency: "USD",
      status: "PUBLISHED",
      publishedAt: new Date(),
      description:
        "Partner with engineering leaders and enterprise partners to translate high-throughput infrastructure requirements into clear development sprints and developer-friendly documentation.",
    },
  ];

  for (const jobData of sampleJobs) {
    if (!jobData.categoryId) continue;
    await Job.findOneAndUpdate(
      { slug: jobData.slug },
      { $set: jobData },
      { upsert: true, returnDocument: "after" },
    );
  }
  console.log(`✓ Seeded ${sampleJobs.length} published jobs`);

  // 6. Synchronize Category Job Counters
  for (const cat of CATEGORIES) {
    const catDoc = categoryMap.get(cat.slug);
    if (catDoc) {
      const count = await Job.countDocuments({ categoryId: catDoc._id, status: "PUBLISHED" });
      await Category.findByIdAndUpdate(catDoc._id, { $set: { jobCount: count } });
    }
  }
  console.log(`✓ Synchronized category job counters`);

  console.log("\nDatabase seeding completed successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
