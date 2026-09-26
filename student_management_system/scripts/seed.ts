import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { hashPassword } from "../src/server/auth/password";
import { User, Class, Student } from "../src/server/models";

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

// Obviously fictional sample classes
const SAMPLE_CLASSES = [
  {
    name: "Grade 9 - Orion",
    gradeLevel: "Grade 9",
    capacity: 28,
    homeroomTeacherName: "Prof. Arthur Pendelton",
  },
  {
    name: "Grade 10 - Polaris",
    gradeLevel: "Grade 10",
    capacity: 30,
    homeroomTeacherName: "Dr. Evelyn Vance",
  },
  {
    name: "Grade 11 - Vega",
    gradeLevel: "Grade 11",
    capacity: 25,
    homeroomTeacherName: "Mr. Lucas Sterling",
  },
  {
    name: "Grade 12 - Nebula",
    gradeLevel: "Grade 12",
    capacity: 25,
    homeroomTeacherName: "Ms. Clara Oswald",
  },
];

// Obviously fictional students (cosmic/fictional names per sensitive PII rules)
const SAMPLE_STUDENTS = [
  {
    studentId: "STU-2026-001",
    firstName: "Nova",
    lastName: "Starling",
    dob: new Date("2010-04-12"),
    gender: "FEMALE" as const,
    enrollmentDate: new Date("2024-09-01"),
    status: "ACTIVE" as const,
    guardianName: "Helena Starling",
    guardianPhone: "+1-555-0199",
    guardianEmail: "helena.starling@fictional-domain.internal",
    phone: "+1-555-0101",
    email: "nova.starling@fictional-student.internal",
    address: "42 Constellation Way, Sector 7",
    notes: "Honor roll student, science club captain.",
    className: "Grade 10 - Polaris",
  },
  {
    studentId: "STU-2026-002",
    firstName: "Alex",
    lastName: "Quasar",
    dob: new Date("2011-08-23"),
    gender: "MALE" as const,
    enrollmentDate: new Date("2024-09-01"),
    status: "ACTIVE" as const,
    guardianName: "Marcus Quasar",
    guardianPhone: "+1-555-0198",
    guardianEmail: "marcus.quasar@fictional-domain.internal",
    phone: "+1-555-0102",
    email: "alex.quasar@fictional-student.internal",
    address: "108 Nebula Avenue, Sector 9",
    notes: "Member of robotics society.",
    className: "Grade 9 - Orion",
  },
  {
    studentId: "STU-2026-003",
    firstName: "Jordan",
    lastName: "Eclipse",
    dob: new Date("2009-11-05"),
    gender: "OTHER" as const,
    enrollmentDate: new Date("2023-09-01"),
    status: "ACTIVE" as const,
    guardianName: "Rowan Eclipse",
    guardianPhone: "+1-555-0197",
    guardianEmail: "rowan.eclipse@fictional-domain.internal",
    phone: "+1-555-0103",
    email: "jordan.eclipse@fictional-student.internal",
    address: "7 Lunar Crescent, Sector 12",
    notes: "Drama club lead actor.",
    className: "Grade 11 - Vega",
  },
  {
    studentId: "STU-2026-004",
    firstName: "Taylor",
    lastName: "Zenith",
    dob: new Date("2008-02-17"),
    gender: "FEMALE" as const,
    enrollmentDate: new Date("2022-09-01"),
    status: "ACTIVE" as const,
    guardianName: "Diane Zenith",
    guardianPhone: "+1-555-0196",
    guardianEmail: "diane.zenith@fictional-domain.internal",
    phone: "+1-555-0104",
    email: "taylor.zenith@fictional-student.internal",
    address: "15 Apex Blvd, Sector 3",
    notes: "Senior prefect, mathematics competition winner.",
    className: "Grade 12 - Nebula",
  },
  {
    studentId: "STU-2026-005",
    firstName: "Morgan",
    lastName: "Comet",
    dob: new Date("2010-06-30"),
    gender: "MALE" as const,
    enrollmentDate: new Date("2024-09-01"),
    status: "INACTIVE" as const,
    guardianName: "David Comet",
    guardianPhone: "+1-555-0195",
    guardianEmail: "david.comet@fictional-domain.internal",
    phone: "+1-555-0105",
    email: "morgan.comet@fictional-student.internal",
    address: "88 Orbit Lane, Sector 5",
    notes: "On medical leave for semester.",
    className: "Grade 10 - Polaris",
  },
];

async function seed() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "studentms";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@studentms.internal")
    .toLowerCase()
    .trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminStrongPass123!";

  if (!uri) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  console.log(`Connecting to MongoDB Atlas (${dbName})...`);
  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 8000,
  });

  console.log("Connected. Seeding Student Management System...");

  // 1. Initial Admin User
  const adminPasswordHash = await hashPassword(adminPassword);
  const adminUser = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: "School Administrator",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        status: "ACTIVE",
        mustChangePassword: false,
        isDemo: false,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  console.log(`✓ Admin user seeded (${adminEmail})`);

  // 2. Initial Staff User (Direct dashboard access for testing)
  const staffEmail = "staff@studentms.internal";
  const staffPasswordHash = await hashPassword("StaffInitialPass123!");
  const staffUser = await User.findOneAndUpdate(
    { email: staffEmail },
    {
      $set: {
        name: "Sarah Jenkins (Staff)",
        email: staffEmail,
        passwordHash: staffPasswordHash,
        role: "STAFF",
        status: "ACTIVE",
        mustChangePassword: false,
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  console.log(`✓ Staff user seeded (${staffEmail})`);

  // 3. Classes
  const classMap = new Map<string, mongoose.Types.ObjectId>();
  for (const c of SAMPLE_CLASSES) {
    const classDoc = await Class.findOneAndUpdate(
      { name: c.name },
      {
        $set: {
          name: c.name,
          gradeLevel: c.gradeLevel,
          capacity: c.capacity,
          homeroomTeacherName: c.homeroomTeacherName,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    classMap.set(c.name, classDoc._id);
  }
  console.log(`✓ Seeded ${SAMPLE_CLASSES.length} fictional classes`);

  // 4. Students
  for (const s of SAMPLE_STUDENTS) {
    const classId = classMap.get(s.className);
    if (!classId) continue;

    await Student.findOneAndUpdate(
      { studentId: s.studentId },
      {
        $set: {
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          dob: s.dob,
          gender: s.gender,
          classId,
          enrollmentDate: s.enrollmentDate,
          status: s.status,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone,
          guardianEmail: s.guardianEmail,
          phone: s.phone,
          email: s.email,
          address: s.address,
          notes: s.notes,
          createdBy: adminUser._id,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  }
  console.log(`✓ Seeded ${SAMPLE_STUDENTS.length} fictional students`);

  console.log("\nDatabase seed completed successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
