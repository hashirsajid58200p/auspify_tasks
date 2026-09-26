import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Class } from "@/server/models/class";
import { Student } from "@/server/models/student";
import { User } from "@/server/models/user";
import {
  listClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} from "@/server/services/classes";
import { BadRequestError, ConflictError, NotFoundError } from "@/server/http";

describe("Class Service & Domain Invariants", () => {
  let mongoServer: MongoMemoryServer;
  let testActorId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    const user = await User.create({
      name: "Admin Tester",
      email: "admin.tester@school.org",
      passwordHash: "hash-not-needed-here",
      role: "ADMIN",
      status: "ACTIVE",
    });
    testActorId = user._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Student.deleteMany({});
    await Class.deleteMany({});
  });

  it("creates a class with valid fields and defaults", async () => {
    const created = await createClass({
      name: "Grade 10 - Alpha",
      gradeLevel: "Grade 10",
      capacity: 35,
      homeroomTeacherName: "Ms. Robinson",
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Grade 10 - Alpha");
    expect(created.capacity).toBe(35);
    expect(created.enrolledCount).toBe(0);
  });

  it("rejects duplicate class name with ConflictError", async () => {
    await createClass({
      name: "Grade 10 - Beta",
      gradeLevel: "Grade 10",
      capacity: 30,
      homeroomTeacherName: "Mr. Smith",
    });

    await expect(
      createClass({
        name: "grade 10 - beta", // Case-insensitive collision
        gradeLevel: "Grade 10",
        capacity: 25,
        homeroomTeacherName: "Mr. Jones",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("lists classes with aggregate enrolled and active student counts", async () => {
    const clsA = await createClass({
      name: "Grade 9 - A",
      gradeLevel: "Grade 9",
      capacity: 30,
      homeroomTeacherName: "Teacher A",
    });

    const clsB = await createClass({
      name: "Grade 9 - B",
      gradeLevel: "Grade 9",
      capacity: 30,
      homeroomTeacherName: "Teacher B",
    });

    // Create 2 students in clsA (1 active, 1 graduated)
    await Student.create([
      {
        studentId: "STU-001",
        firstName: "Alice",
        lastName: "Alpha",
        dob: new Date("2009-01-01"),
        gender: "FEMALE",
        classId: new mongoose.Types.ObjectId(clsA.id),
        status: "ACTIVE",
        guardianName: "Guardian Alpha",
        guardianPhone: "1234567890",
        guardianEmail: "guard@alpha.org",
        createdBy: testActorId,
      },
      {
        studentId: "STU-002",
        firstName: "Bob",
        lastName: "Beta",
        dob: new Date("2009-02-02"),
        gender: "MALE",
        classId: new mongoose.Types.ObjectId(clsA.id),
        status: "GRADUATED",
        guardianName: "Guardian Beta",
        guardianPhone: "1234567891",
        guardianEmail: "guard@beta.org",
        createdBy: testActorId,
      },
    ]);

    const list = await listClasses();
    const itemA = list.find((c) => c.id === clsA.id);
    const itemB = list.find((c) => c.id === clsB.id);

    expect(itemA).toBeDefined();
    expect(itemA?.enrolledCount).toBe(2);
    expect(itemA?.activeCount).toBe(1);

    expect(itemB).toBeDefined();
    expect(itemB?.enrolledCount).toBe(0);
    expect(itemB?.activeCount).toBe(0);
  });

  it("blocks deleting a class when students still reference it (Mandatory Rule)", async () => {
    const cls = await createClass({
      name: "Grade 11 - Gamma",
      gradeLevel: "Grade 11",
      capacity: 25,
      homeroomTeacherName: "Mr. Clark",
    });

    await Student.create({
      studentId: "STU-REF-01",
      firstName: "Carol",
      lastName: "Clark",
      dob: new Date("2008-05-15"),
      gender: "FEMALE",
      classId: new mongoose.Types.ObjectId(cls.id),
      status: "ACTIVE",
      guardianName: "Dan Clark",
      guardianPhone: "1234567892",
      guardianEmail: "dan@clark.org",
      createdBy: testActorId,
    });

    await expect(deleteClass(cls.id)).rejects.toThrow(BadRequestError);
    await expect(deleteClass(cls.id)).rejects.toThrow(/Cannot delete class/i);

    // Verify class was NOT removed
    const found = await Class.findById(cls.id);
    expect(found).not.toBeNull();
  });

  it("successfully deletes a class when no students reference it", async () => {
    const cls = await createClass({
      name: "Grade 12 - Delta",
      gradeLevel: "Grade 12",
      capacity: 20,
      homeroomTeacherName: "Mrs. Davis",
    });

    const result = await deleteClass(cls.id);
    expect(result.success).toBe(true);

    const found = await Class.findById(cls.id);
    expect(found).toBeNull();
  });

  it("throws NotFoundError when operating on non-existent class", async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    await expect(getClassById(nonExistentId)).rejects.toThrow(NotFoundError);
    await expect(deleteClass(nonExistentId)).rejects.toThrow(NotFoundError);
    await expect(updateClass(nonExistentId, { name: "New Name" })).rejects.toThrow(NotFoundError);
  });
});
