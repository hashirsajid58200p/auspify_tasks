import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Course } from "@/server/models/course";
import { Category } from "@/server/models/category";
import { Enrollment } from "@/server/models/enrollment";
import { Certificate } from "@/server/models/certificate";
import {
  issueCertificate,
  getStudentCertificates,
  getCertificateByCode,
  getCertificateById,
} from "@/server/services/certificates";
import { BadRequestError, NotFoundError } from "@/server/http";

describe("Certificate Service & Verification", () => {
  let mongoServer: MongoMemoryServer;
  let instructor: any;
  let student: any;
  let category: any;
  let course: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Category.deleteMany({});
    await Enrollment.deleteMany({});
    await Certificate.deleteMany({});

    instructor = await User.create({
      name: "Dr. Evelyn Reed",
      email: "evelyn@lms.local",
      passwordHash: "hash-eve",
      role: "INSTRUCTOR",
      status: "ACTIVE",
      isDemo: false,
    });

    student = await User.create({
      name: "Lucas Vance",
      email: "lucas@lms.local",
      passwordHash: "hash-lucas",
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    });

    category = await Category.create({
      name: "Computer Science",
      slug: "computer-science",
    });

    course = await Course.create({
      title: "Full-Stack Distributed Systems",
      slug: "full-stack-distributed-systems",
      summary: "Modern scalable systems architecture.",
      instructorId: instructor._id,
      categoryId: category._id,
      status: "PUBLISHED",
      level: "ADVANCED",
    });
  });

  it("should reject issuing a certificate if course requirements are not 100% complete", async () => {
    // Incomplete enrollment (50% progress)
    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "ACTIVE",
      progressPct: 50,
    });

    await expect(
      issueCertificate(student._id.toString(), course._id.toString())
    ).rejects.toThrow(BadRequestError);

    const count = await Certificate.countDocuments();
    expect(count).toBe(0);
  });

  it("should issue a unique certificate when course progress reaches 100%", async () => {
    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "COMPLETED",
      progressPct: 100,
      completedAt: new Date(),
    });

    const cert = await issueCertificate(student._id.toString(), course._id.toString());
    expect(cert).toBeDefined();
    expect(cert.code).toMatch(/^EDU-[A-F0-9]{8}$/);
    expect(cert.userId.toString()).toBe(student._id.toString());
    expect(cert.courseId.toString()).toBe(course._id.toString());

    const count = await Certificate.countDocuments();
    expect(count).toBe(1);
  });

  it("should be strictly idempotent and return the existing certificate without duplicating records", async () => {
    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "COMPLETED",
      progressPct: 100,
      completedAt: new Date(),
    });

    const firstCert = await issueCertificate(student._id.toString(), course._id.toString());
    const secondCert = await issueCertificate(student._id.toString(), course._id.toString());

    expect(firstCert._id.toString()).toBe(secondCert._id.toString());
    expect(firstCert.code).toBe(secondCert.code);

    const count = await Certificate.countDocuments();
    expect(count).toBe(1);
  });

  it("should allow public verification of certificate by unique code", async () => {
    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "COMPLETED",
      progressPct: 100,
      completedAt: new Date(),
    });

    const cert = await issueCertificate(student._id.toString(), course._id.toString());

    const verified = await getCertificateByCode(cert.code);
    expect(verified).toBeDefined();
    expect(verified.studentName).toBe("Lucas Vance");
    expect(verified.course.title).toBe("Full-Stack Distributed Systems");
    expect(verified.course.instructorName).toBe("Dr. Evelyn Reed");
    expect(verified.code).toBe(cert.code);

    // Nonexistent code throws NotFoundError
    await expect(getCertificateByCode("EDU-NONEXISTENT")).rejects.toThrow(NotFoundError);
  });

  it("should return student certificates with populated metadata", async () => {
    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "COMPLETED",
      progressPct: 100,
      completedAt: new Date(),
    });

    await issueCertificate(student._id.toString(), course._id.toString());

    const list = await getStudentCertificates(student._id.toString());
    expect(list.length).toBe(1);
    expect(list[0].course.title).toBe("Full-Stack Distributed Systems");
    expect(list[0].course.instructorName).toBe("Dr. Evelyn Reed");
  });
});
