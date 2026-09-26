import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { Quiz } from "@/server/models/quiz";
import { Assignment } from "@/server/models/assignment";
import { Enrollment } from "@/server/models/enrollment";
import { Certificate } from "@/server/models/certificate";
import { AuditLog } from "@/server/models/audit-log";
import { registerUser, authenticateUser } from "@/server/services/auth";
import { createCourse, updateCourseStatus } from "@/server/services/courses";
import { createModule, createLesson } from "@/server/services/curriculum";
import { createQuiz } from "@/server/services/quizzes";
import { createAssignment } from "@/server/services/assignments";
import { enrollStudent } from "@/server/services/enrollments";
import { completeLesson } from "@/server/services/progress";
import { startOrResumeAttempt, submitQuizAttempt } from "@/server/services/attempts";
import { submitAssignment, gradeSubmission } from "@/server/services/submissions";
import { getStudentGrades } from "@/server/services/grades";
import { getCertificateByCode } from "@/server/services/certificates";
import { updateUserRole } from "@/server/services/admin";
import { CurrentUser } from "@/server/auth/session";

describe("Full Platform Multi-Role Integration Journey", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET =
      "test-access-secret-minimum-32-characters-long-key-for-auth";
    process.env.JWT_REFRESH_SECRET =
      "test-refresh-secret-minimum-32-characters-long-key-for-auth";

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("should complete the full multi-role platform lifecycle from registration to graduation", async () => {
    // ----------------------------------------------------
    // 1. Initial Setup: Root Admin & Category
    // ----------------------------------------------------
    const adminUserDoc = await User.create({
      name: "Root Administrator",
      email: "admin@lms.local",
      passwordHash: "hash-admin",
      role: "ADMIN",
      status: "ACTIVE",
      isDemo: false,
    });

    const category = await Category.create({
      name: "Software Engineering",
      slug: "software-engineering",
      description: "Full stack engineering disciplines.",
    });

    // ----------------------------------------------------
    // 2. User Registration & Role Escalation
    // ----------------------------------------------------
    // A) Register Instructor account (initially created as STUDENT per registration rules)
    const instructorAuth = await registerUser({
      name: "Prof. Ada Lovelace",
      email: "ada@lms.local",
      password: "Password123!",
    });
    expect(instructorAuth.user.role).toBe("STUDENT");

    // Admin promotes Ada to INSTRUCTOR
    await updateUserRole(
      adminUserDoc._id.toString(),
      instructorAuth.user.id,
      "INSTRUCTOR"
    );

    const instructorUser: CurrentUser = {
      userId: instructorAuth.user.id,
      email: instructorAuth.user.email,
      name: instructorAuth.user.name,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      isDemo: false,
    };

    // B) Register Student account
    const studentAuth = await registerUser({
      name: "Charles Babbage",
      email: "charles@lms.local",
      password: "Password123!",
    });
    expect(studentAuth.user.role).toBe("STUDENT");

    const studentUser: CurrentUser = {
      userId: studentAuth.user.id,
      email: studentAuth.user.email,
      name: studentAuth.user.name,
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    };

    // ----------------------------------------------------
    // 3. Instructor Builds Course Curriculum
    // ----------------------------------------------------
    // Create course in DRAFT
    const course = await createCourse(instructorUser, {
      title: "Analytical Engine Architecture",
      summary: "Principles of programmable computational mechanisms.",
      description: "Comprehensive study of mechanical computation and software logic.",
      categoryId: category._id.toString(),
      level: "INTERMEDIATE",
      thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    });
    expect(course.status).toBe("DRAFT");

    // Add Module
    const moduleItem = await createModule(course.id, instructorUser, {
      title: "Foundations of Memory & Storage",
    });

    // Add Lesson
    const lesson = await createLesson(
      course.id,
      instructorUser,
      {
        moduleId: moduleItem.id,
        title: "Punch Card Data Encodings",
        type: "TEXT",
        content: "# Punch Card Storage\nBinary encoding formats for analytical storage.",
        isPreview: false,
      }
    );

    // Add Quiz
    const quiz = await createQuiz(instructorUser, course.id, {
      title: "Mechanical Logic Evaluation",
      moduleId: moduleItem.id,
      passingPct: 80,
      maxAttempts: 3,
      shuffle: false,
      showAnswers: "AFTER_SUBMIT",
      isRequired: true,
      questions: [
        {
          id: "q1",
          type: "SINGLE",
          prompt: "What mechanism stores variables in the analytical engine?",
          points: 100,
          options: [
            { id: "o1", text: "The Store", isCorrect: true },
            { id: "o2", text: "The Mill", isCorrect: false },
          ],
        },
      ],
    });

    // Add Assignment
    const assignment = await createAssignment(instructorUser, course.id, {
      title: "Algorithm No. 1 for Bernoulli Numbers",
      instructions: "Implement the mechanical trace chart for Bernoulli numbers.",
      maxPoints: 100,
      moduleId: moduleItem.id,
      isRequired: true,
      allowLate: true,
    });

    // Publish Course
    const published = await updateCourseStatus(course.id, instructorUser, "PUBLISH");
    expect(published.status).toBe("PUBLISHED");

    // ----------------------------------------------------
    // 4. Student Enrolls in Course
    // ----------------------------------------------------
    const enrollment = await enrollStudent(studentUser.userId, course.id);
    expect(enrollment.status).toBe("ACTIVE");
    expect(enrollment.progressPct).toBe(0);

    // ----------------------------------------------------
    // 5. Student Completes Content & Assessments
    // ----------------------------------------------------
    // A) Complete lesson
    const lessonResult = await completeLesson(studentUser, lesson.id);
    expect(lessonResult.progressPct).toBeGreaterThan(0);

    // B) Take and pass Quiz
    const attempt = await startOrResumeAttempt(studentUser, quiz._id.toString());
    const quizSubmission = await submitQuizAttempt(studentUser, attempt.attemptId, [
      { questionId: "q1", selectedOptionIds: ["o1"] },
    ]);
    expect(quizSubmission.passed).toBe(true);
    expect(quizSubmission.score).toBe(100);

    // C) Submit Assignment
    const asgnSubmission = await submitAssignment(
      studentUser,
      assignment._id.toString(),
      "Here is my mechanical algorithm implementation for Bernoulli numbers.",
      "https://github.com/charles/analytical-engine-algorithms"
    );
    expect(asgnSubmission.status).toBe("SUBMITTED");

    // ----------------------------------------------------
    // 6. Verify 100% Progress & Automatic Certificate Issuance
    // ----------------------------------------------------
    const studentEnrollment = await Enrollment.findOne({
      userId: new Types.ObjectId(studentUser.userId),
      courseId: new Types.ObjectId(course.id),
    });
    expect(studentEnrollment?.status).toBe("COMPLETED");
    expect(studentEnrollment?.progressPct).toBe(100);

    // Verified: Certificate auto-issued upon 100% completion
    const cert = await Certificate.findOne({
      userId: new Types.ObjectId(studentUser.userId),
      courseId: new Types.ObjectId(course.id),
    });
    expect(cert).toBeDefined();
    expect(cert?.code).toMatch(/^EDU-[A-F0-9]{8}$/);

    // Public verification by code
    const verifiedPublic = await getCertificateByCode(cert!.code);
    expect(verifiedPublic.studentName).toBe("Charles Babbage");
    expect(verifiedPublic.course.title).toBe("Analytical Engine Architecture");

    // ----------------------------------------------------
    // 7. Instructor Grades Assignment
    // ----------------------------------------------------
    const graded = await gradeSubmission(
      instructorUser,
      (asgnSubmission as any)._id.toString(),
      95,
      "Superb mechanical accuracy and algorithmic clarity."
    );
    expect(graded.status).toBe("GRADED");
    expect(graded.grade).toBe(95);

    // ----------------------------------------------------
    // 8. Student Transcripts & Grades Verification
    // ----------------------------------------------------
    const studentGrades = await getStudentGrades(studentUser.userId);
    expect(studentGrades.length).toBe(1);
    expect(studentGrades[0].totalPossiblePoints).toBe(200); // 100 (quiz) + 100 (assignment)
    expect(studentGrades[0].totalEarnedPoints).toBe(195); // 100 + 95
    expect(studentGrades[0].overallPercentage).toBe(98); // 195/200 = 97.5% -> 98%
    expect(studentGrades[0].letterGrade).toBe("A");

    // ----------------------------------------------------
    // 9. Admin Audit Trail Verification
    // ----------------------------------------------------
    const auditLogs = await AuditLog.find({}).lean();
    expect(auditLogs.length).toBeGreaterThan(0);
    const roleLog = auditLogs.find((l) => l.action === "USER_ROLE_UPDATED");
    expect(roleLog).toBeDefined();
  });
});
