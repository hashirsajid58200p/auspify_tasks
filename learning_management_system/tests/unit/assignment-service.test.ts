import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Assignment } from "@/server/models/assignment";
import { Submission } from "@/server/models/submission";
import { Enrollment } from "@/server/models/enrollment";
import { User } from "@/server/models/user";
import { CurrentUser } from "@/server/auth/session";
import {
  createAssignment,
  getAssignmentForStudent,
  deleteAssignment,
} from "@/server/services/assignments";
import {
  submitAssignment,
  gradeSubmission,
  getCourseSubmissionsQueue,
} from "@/server/services/submissions";
import { NotFoundError, BadRequestError } from "@/server/http";

describe("Assignment & Submission Service", () => {
  let mongoServer: MongoMemoryServer;
  let category: any;
  let instructor: any;
  let student: any;
  let course: any;

  const instructorUser: CurrentUser = {
    userId: "",
    email: "instructor@lms.local",
    name: "Instructor Alice",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    isDemo: false,
  };

  const studentUser: CurrentUser = {
    userId: "",
    email: "student@lms.local",
    name: "Student Bob",
    role: "STUDENT",
    status: "ACTIVE",
    isDemo: false,
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    instructor = await User.create({
      name: "Instructor Alice",
      email: "instructor@lms.local",
      passwordHash: "hash123",
      role: "INSTRUCTOR",
      status: "ACTIVE",
    });
    instructorUser.userId = instructor._id.toString();

    student = await User.create({
      name: "Student Bob",
      email: "student@lms.local",
      passwordHash: "hash123",
      role: "STUDENT",
      status: "ACTIVE",
    });
    studentUser.userId = student._id.toString();

    category = await Category.create({
      name: "Software Engineering",
      slug: "software-engineering",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Course.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Enrollment.deleteMany({});

    course = await Course.create({
      instructorId: instructor._id,
      title: "Backend Microservices",
      slug: "backend-microservices",
      summary: "Event-driven architecture",
      categoryId: category._id,
      level: "ADVANCED",
      status: "PUBLISHED",
    });

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "ACTIVE",
    });
  });

  it("should create assignment and allow student to submit and resubmit", async () => {
    const assignment = await createAssignment(
      instructorUser,
      course._id.toString(),
      {
        title: "Docker Compose Deployment",
        instructions: "Submit your docker-compose.yml file and github link.",
        maxPoints: 100,
        allowLate: true,
        isRequired: true,
      }
    );

    expect(assignment._id).toBeDefined();

    // Student initial submission
    const sub1 = await submitAssignment(
      studentUser,
      assignment._id.toString(),
      "Here is my configuration",
      "https://github.com/student/docker-assignment"
    );

    expect(sub1.status).toBe("SUBMITTED");
    expect(sub1.linkUrl).toBe("https://github.com/student/docker-assignment");

    // Student resubmits with updated text
    const sub2 = await submitAssignment(
      studentUser,
      assignment._id.toString(),
      "Updated docker-compose with healthchecks",
      "https://github.com/student/docker-assignment-v2"
    );

    expect(sub2._id.toString()).toBe(sub1._id.toString());
    expect(sub2.text).toBe("Updated docker-compose with healthchecks");
  });

  it("should reject late submission when allowLate is false", async () => {
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    const assignment = await createAssignment(
      instructorUser,
      course._id.toString(),
      {
        title: "Strict Deadline Assignment",
        instructions: "No late submissions allowed",
        dueAt: pastDate.toISOString(),
        allowLate: false,
        maxPoints: 50,
      }
    );

    await expect(
      submitAssignment(
        studentUser,
        assignment._id.toString(),
        "Late submission attempt",
        undefined
      )
    ).rejects.toThrow(BadRequestError);
  });

  it("should allow instructor to grade submission and clamp grades to 0..maxPoints", async () => {
    const assignment = await createAssignment(
      instructorUser,
      course._id.toString(),
      {
        title: "Database Indexing Assignment",
        instructions: "Optimize the queries",
        maxPoints: 80,
      }
    );

    const sub = await submitAssignment(
      studentUser,
      assignment._id.toString(),
      "My indexes are B-tree",
      undefined
    );

    // Instructor grades with 95 points (exceeding 80 maxPoints -> should clamp to 80)
    const graded = await gradeSubmission(
      instructorUser,
      sub._id.toString(),
      95,
      "Excellent work! Index choices were optimal."
    );

    expect(graded.status).toBe("GRADED");
    expect(graded.grade).toBe(80); // CLAMPED to maxPoints!
    expect(graded.feedback).toContain("Excellent work");

    // Once graded, student cannot resubmit
    await expect(
      submitAssignment(
        studentUser,
        assignment._id.toString(),
        "Attempting resubmit after grade",
        undefined
      )
    ).rejects.toThrow(BadRequestError);
  });

  it("should retrieve course submissions queue for instructor", async () => {
    const assignment = await createAssignment(
      instructorUser,
      course._id.toString(),
      {
        title: "Queue Assignment",
        instructions: "Instructions",
        maxPoints: 100,
      }
    );

    await submitAssignment(
      studentUser,
      assignment._id.toString(),
      "Student solution",
      "https://github.com/student/solution"
    );

    const queue = await getCourseSubmissionsQueue(
      instructorUser,
      course._id.toString()
    );

    expect(queue).toHaveLength(1);
    expect(queue[0].student?.name).toBe("Student Bob");
    expect(queue[0].assignment?.title).toBe("Queue Assignment");
    expect(queue[0].status).toBe("SUBMITTED");
  });

  it("should prevent deleting an assignment that has submissions", async () => {
    const assignment = await createAssignment(
      instructorUser,
      course._id.toString(),
      {
        title: "Non-deletable Assignment",
        instructions: "Instructions",
        maxPoints: 100,
      }
    );

    await submitAssignment(
      studentUser,
      assignment._id.toString(),
      "Text",
      undefined
    );

    await expect(
      deleteAssignment(
        instructorUser,
        course._id.toString(),
        assignment._id.toString()
      )
    ).rejects.toThrow(BadRequestError);
  });
});
