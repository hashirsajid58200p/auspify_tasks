import crypto from "crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Certificate, ICertificate } from "@/server/models/certificate";
import { Enrollment } from "@/server/models/enrollment";
import { Course } from "@/server/models/course";
import { User } from "@/server/models/user";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/server/http";

export function generateCertificateCode(): string {
  const bytes = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `EDU-${bytes}`;
}

export async function issueCertificate(
  userId: string | Types.ObjectId,
  courseId: string | Types.ObjectId
): Promise<ICertificate> {
  await connectToDatabase();

  const userOid = new Types.ObjectId(userId);
  const courseOid = new Types.ObjectId(courseId);

  // Idempotency: If already issued, return existing certificate immediately
  const existing = await Certificate.findOne({
    userId: userOid,
    courseId: courseOid,
  });

  if (existing) {
    return existing;
  }

  // Verify eligibility: student must be enrolled and progress at 100%
  const enrollment = await Enrollment.findOne({
    userId: userOid,
    courseId: courseOid,
  });

  if (!enrollment || enrollment.progressPct < 100) {
    throw new BadRequestError(
      "Cannot issue certificate: Course requirements have not been completed."
    );
  }

  // Attempt certificate creation with collision avoidance
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCertificateCode();
    try {
      const cert = await Certificate.create({
        userId: userOid,
        courseId: courseOid,
        code,
        issuedAt: new Date(),
      });
      return cert;
    } catch (err: unknown) {
      const mongoErr = err as { code?: number; keyPattern?: Record<string, number> };
      if (mongoErr.code === 11000) {
        // If duplicate on userId + courseId, another concurrent call created it -> return existing
        if (mongoErr.keyPattern?.userId && mongoErr.keyPattern?.courseId) {
          const concurrentCert = await Certificate.findOne({
            userId: userOid,
            courseId: courseOid,
          });
          if (concurrentCert) return concurrentCert;
        }
        // If collision on code, retry loop with new code
        continue;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate unique certificate code after multiple attempts");
}

export async function getStudentCertificates(userId: string) {
  await connectToDatabase();

  const certs = await Certificate.find({ userId: new Types.ObjectId(userId) })
    .sort({ issuedAt: -1 })
    .populate({
      path: "courseId",
      select: "title slug level instructorId",
      populate: {
        path: "instructorId",
        select: "name",
      },
    })
    .lean();

  return certs.map((c) => {
    const course = c.courseId as unknown as {
      _id: Types.ObjectId;
      title: string;
      slug: string;
      level: string;
      instructorId?: { name: string };
    };

    return {
      id: c._id.toString(),
      code: c.code,
      issuedAt: c.issuedAt,
      course: {
        id: course?._id?.toString() || "",
        title: course?.title || "Course",
        slug: course?.slug || "",
        level: course?.level || "ALL_LEVELS",
        instructorName: course?.instructorId?.name || "EduFlow Instructor",
      },
    };
  });
}

export async function getCertificateByCode(code: string) {
  await connectToDatabase();

  const normalizedCode = code.trim().toUpperCase();
  const cert = await Certificate.findOne({ code: normalizedCode })
    .populate<{ userId: { _id: Types.ObjectId; name: string } }>("userId", "name")
    .populate({
      path: "courseId",
      select: "title slug level instructorId",
      populate: {
        path: "instructorId",
        select: "name",
      },
    })
    .lean();

  if (!cert) {
    throw new NotFoundError("Certificate not found. Please verify the code.");
  }

  const user = cert.userId as unknown as { name: string };
  const course = cert.courseId as unknown as {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    level: string;
    instructorId?: { name: string };
  };

  return {
    id: cert._id.toString(),
    code: cert.code,
    issuedAt: cert.issuedAt,
    studentName: user?.name || "Verified Student",
    course: {
      id: course?._id?.toString() || "",
      title: course?.title || "Course",
      slug: course?.slug || "",
      level: course?.level || "ALL_LEVELS",
      instructorName: course?.instructorId?.name || "EduFlow Instructor",
    },
    issuer: "EduFlow Learning Management System",
  };
}

export async function getCertificateById(
  id: string,
  requestingUserId?: string,
  requestingUserRole?: string
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundError("Certificate not found");
  }

  await connectToDatabase();

  const cert = await Certificate.findById(id)
    .populate<{ userId: { _id: Types.ObjectId; name: string } }>("userId", "name")
    .populate({
      path: "courseId",
      select: "title slug level instructorId",
      populate: {
        path: "instructorId",
        select: "name",
      },
    })
    .lean();

  if (!cert) {
    throw new NotFoundError("Certificate not found");
  }

  if (
    requestingUserId &&
    requestingUserRole !== "ADMIN" &&
    cert.userId._id.toString() !== requestingUserId
  ) {
    // 404 to prevent enumeration
    throw new NotFoundError("Certificate not found");
  }

  const user = cert.userId as unknown as { name: string };
  const course = cert.courseId as unknown as {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    level: string;
    instructorId?: { name: string };
  };

  return {
    id: cert._id.toString(),
    code: cert.code,
    issuedAt: cert.issuedAt,
    studentName: user?.name || "Verified Student",
    course: {
      id: course?._id?.toString() || "",
      title: course?.title || "Course",
      slug: course?.slug || "",
      level: course?.level || "ALL_LEVELS",
      instructorName: course?.instructorId?.name || "EduFlow Instructor",
    },
    issuer: "EduFlow Learning Management System",
  };
}
