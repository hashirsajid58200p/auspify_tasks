import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Enrollment } from "@/server/models/enrollment";
import { User } from "@/server/models/user";
import {
  enrollStudent,
  dropCourse,
  getUserEnrollments,
} from "@/server/services/enrollments";
import { NotFoundError, BadRequestError } from "@/server/http";

describe("Enrollment Service", () => {
  let mongoServer: MongoMemoryServer;
  let category: any;
  let instructor: any;
  let student: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    instructor = await User.create({
      name: "Instructor Isaac",
      email: "isaac@lms.local",
      passwordHash: "hash123",
      role: "INSTRUCTOR",
      status: "ACTIVE",
    });

    student = await User.create({
      name: "Student Sam",
      email: "sam@lms.local",
      passwordHash: "hash123",
      role: "STUDENT",
      status: "ACTIVE",
    });

    category = await Category.create({
      name: "Computer Science",
      slug: "computer-science",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
  });

  it("should enroll student idempotently and increment enrollmentCount", async () => {
    const course = await Course.create({
      instructorId: instructor._id,
      title: "Algorithms 101",
      slug: "algorithms-101",
      summary: "Sorting and graphs",
      categoryId: category._id,
      level: "BEGINNER",
      status: "PUBLISHED",
      enrollmentCount: 0,
    });

    // 1st enroll
    const res1 = await enrollStudent(student._id.toString(), course._id.toString());
    expect(res1.alreadyEnrolled).toBe(false);
    expect(res1.status).toBe("ACTIVE");

    const updatedCourse1 = await Course.findById(course._id);
    expect(updatedCourse1?.enrollmentCount).toBe(1);

    // 2nd enroll (idempotent)
    const res2 = await enrollStudent(student._id.toString(), course._id.toString());
    expect(res2.alreadyEnrolled).toBe(true);
    expect(res2.status).toBe("ACTIVE");

    const updatedCourse2 = await Course.findById(course._id);
    expect(updatedCourse2?.enrollmentCount).toBe(1); // Not incremented again!

    const countInDb = await Enrollment.countDocuments({
      userId: student._id,
      courseId: course._id,
    });
    expect(countInDb).toBe(1);
  });

  it("should reject enrollment in draft or archived courses", async () => {
    const draft = await Course.create({
      instructorId: instructor._id,
      title: "Draft Course",
      slug: "draft-course",
      summary: "Draft",
      categoryId: category._id,
      level: "BEGINNER",
      status: "DRAFT",
    });

    const archived = await Course.create({
      instructorId: instructor._id,
      title: "Archived Course",
      slug: "archived-course",
      summary: "Archived",
      categoryId: category._id,
      level: "BEGINNER",
      status: "ARCHIVED",
    });

    await expect(
      enrollStudent(student._id.toString(), draft._id.toString())
    ).rejects.toThrow(BadRequestError);

    await expect(
      enrollStudent(student._id.toString(), archived._id.toString())
    ).rejects.toThrow(BadRequestError);
  });

  it("should drop an active course and decrement enrollmentCount", async () => {
    const course = await Course.create({
      instructorId: instructor._id,
      title: "Operating Systems",
      slug: "operating-systems",
      summary: "Kernel and memory",
      categoryId: category._id,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      enrollmentCount: 0,
    });

    await enrollStudent(student._id.toString(), course._id.toString());
    const beforeDrop = await Course.findById(course._id);
    expect(beforeDrop?.enrollmentCount).toBe(1);

    const dropRes = await dropCourse(student._id.toString(), course._id.toString());
    expect(dropRes.success).toBe(true);

    const afterDrop = await Course.findById(course._id);
    expect(afterDrop?.enrollmentCount).toBe(0);

    const enrollment = await Enrollment.findOne({
      userId: student._id,
      courseId: course._id,
    });
    expect(enrollment?.status).toBe("DROPPED");
  });

  it("should retrieve active and completed enrollments for student", async () => {
    const course1 = await Course.create({
      instructorId: instructor._id,
      title: "Course 1",
      slug: "course-1",
      summary: "Active course",
      categoryId: category._id,
      level: "BEGINNER",
      status: "PUBLISHED",
    });

    const course2 = await Course.create({
      instructorId: instructor._id,
      title: "Course 2",
      slug: "course-2",
      summary: "To be dropped",
      categoryId: category._id,
      level: "BEGINNER",
      status: "PUBLISHED",
    });

    await enrollStudent(student._id.toString(), course1._id.toString());
    await enrollStudent(student._id.toString(), course2._id.toString());
    await dropCourse(student._id.toString(), course2._id.toString());

    const myCourses = await getUserEnrollments(student._id.toString());
    expect(myCourses).toHaveLength(1);
    expect(myCourses[0].courseId).toBe(course1._id.toString());
    expect(myCourses[0].status).toBe("ACTIVE");
  });
});
