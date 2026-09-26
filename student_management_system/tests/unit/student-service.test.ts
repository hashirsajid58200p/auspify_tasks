import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Class } from "@/server/models/class";
import { Student } from "@/server/models/student";
import { AuditLog } from "@/server/models/audit-log";
import { User } from "@/server/models/user";
import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/server/services/students";
import { ConflictError, NotFoundError, BadRequestError } from "@/server/http";

describe("Student Service & Security Invariants", () => {
  let mongoServer: MongoMemoryServer;
  let testActorId: string;
  let testClassId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    const user = await User.create({
      name: "Staff Member",
      email: "staff.tester@school.org",
      passwordHash: "hash-placeholder",
      role: "STAFF",
      status: "ACTIVE",
    });
    testActorId = user._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await AuditLog.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});

    const cls = await Class.create({
      name: "Grade 10 - Alpha",
      gradeLevel: "Grade 10",
      capacity: 30,
      homeroomTeacherName: "Ms. Robinson",
    });
    testClassId = cls._id.toString();
  });

  it("creates a student with valid payload and associates creator", async () => {
    const student = await createStudent(
      {
        studentId: "STU-2024-001",
        firstName: "Leo",
        lastName: "Vance",
        dob: "2008-04-12",
        gender: "MALE",
        classId: testClassId,
        status: "ACTIVE",
        guardianName: "Eleanor Vance",
        guardianPhone: "+1-555-0199",
        guardianEmail: "eleanor.vance@example.org",
        address: "742 Evergreen Terrace",
      },
      testActorId,
    );

    expect(student.id).toBeDefined();
    expect(student.studentId).toBe("STU-2024-001");
    expect(student.firstName).toBe("Leo");
    expect(student.lastName).toBe("Vance");
    expect(student.createdBy).toBe(testActorId);
    expect(student.class?.name).toBe("Grade 10 - Alpha");
  });

  it("rejects duplicate studentId with ConflictError", async () => {
    await createStudent(
      {
        studentId: "STU-DUP-01",
        firstName: "Mia",
        lastName: "Wong",
        dob: "2008-08-08",
        gender: "FEMALE",
        classId: testClassId,
        status: "ACTIVE",
        guardianName: "Ken Wong",
        guardianPhone: "+1-555-0198",
        guardianEmail: "ken.wong@example.org",
      },
      testActorId,
    );

    await expect(
      createStudent(
        {
          studentId: "stu-dup-01", // Case-insensitive collision check
          firstName: "Other",
          lastName: "Student",
          dob: "2008-09-09",
          gender: "MALE",
          classId: testClassId,
          status: "ACTIVE",
          guardianName: "Other Guardian",
          guardianPhone: "+1-555-0100",
          guardianEmail: "other@example.org",
        },
        testActorId,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it("rejects student creation if referenced classId does not exist", async () => {
    const fakeClassId = new mongoose.Types.ObjectId().toString();
    await expect(
      createStudent(
        {
          studentId: "STU-NONEXIST-CLS",
          firstName: "No",
          lastName: "Class",
          dob: "2008-01-01",
          gender: "OTHER",
          classId: fakeClassId,
          status: "ACTIVE",
          guardianName: "Guardian",
          guardianPhone: "+1-555-0101",
          guardianEmail: "guardian@example.org",
        },
        testActorId,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("strictly enforces PII exclusion in student list queries (Mandatory PII Rule)", async () => {
    await createStudent(
      {
        studentId: "STU-PII-CHECK",
        firstName: "Secret",
        lastName: "Minor",
        dob: "2010-06-15",
        gender: "FEMALE",
        classId: testClassId,
        status: "ACTIVE",
        guardianName: "Sensitive Guardian Name",
        guardianPhone: "+1-999-SECRET-PHONE",
        guardianEmail: "sensitive.guardian@private.org",
        address: "123 Classified Residence Lane",
        notes: "Confidential counselor remarks",
      },
      testActorId,
    );

    const result = await listStudents({});
    expect(result.students.length).toBe(1);

    const listed = result.students[0] as unknown as Record<string, unknown>;

    // Allowed public summary fields:
    expect(listed.studentId).toBe("STU-PII-CHECK");
    expect(listed.firstName).toBe("Secret");
    expect(listed.lastName).toBe("Minor");
    expect(listed.className).toBe("Grade 10 - Alpha");

    // Strictly forbidden PII fields in list view:
    expect(listed.dob).toBeUndefined();
    expect(listed.address).toBeUndefined();
    expect(listed.guardianName).toBeUndefined();
    expect(listed.guardianPhone).toBeUndefined();
    expect(listed.guardianEmail).toBeUndefined();
    expect(listed.phone).toBeUndefined();
    expect(listed.email).toBeUndefined();
    expect(listed.notes).toBeUndefined();
  });

  it("exposes full PII only on single student detail query", async () => {
    const created = await createStudent(
      {
        studentId: "STU-DETAIL-CHECK",
        firstName: "Sam",
        lastName: "Fisher",
        dob: "2009-11-20",
        gender: "MALE",
        classId: testClassId,
        status: "ACTIVE",
        guardianName: "Sarah Fisher",
        guardianPhone: "+1-555-0876",
        guardianEmail: "sarah.fisher@example.org",
        address: "88 Splinter Cell Way",
        notes: "Excellent marks in Physical Education",
      },
      testActorId,
    );

    const detail = await getStudentById(created.id);

    expect(detail.guardianName).toBe("Sarah Fisher");
    expect(detail.guardianPhone).toBe("+1-555-0876");
    expect(detail.guardianEmail).toBe("sarah.fisher@example.org");
    expect(detail.address).toBe("88 Splinter Cell Way");
    expect(detail.notes).toBe("Excellent marks in Physical Education");
    expect(new Date(detail.dob).getFullYear()).toBe(2009);
  });

  it("updates mutable fields and preserves immutable studentId", async () => {
    const created = await createStudent(
      {
        studentId: "STU-IMMUTABLE-01",
        firstName: "Oliver",
        lastName: "Queen",
        dob: "2008-03-03",
        gender: "MALE",
        classId: testClassId,
        status: "ACTIVE",
        guardianName: "Robert Queen",
        guardianPhone: "+1-555-0999",
        guardianEmail: "robert.queen@star.org",
      },
      testActorId,
    );

    const updated = await updateStudent(created.id, {
      firstName: "Ollie",
      status: "GRADUATED",
    });

    expect(updated.firstName).toBe("Ollie");
    expect(updated.status).toBe("GRADUATED");
    expect(updated.studentId).toBe("STU-IMMUTABLE-01");
  });

  it("writes immutable audit log entry BEFORE student document is removed (Mandatory Audit Rule)", async () => {
    const created = await createStudent(
      {
        studentId: "STU-AUDIT-DEL-01",
        firstName: "Bruce",
        lastName: "Wayne",
        dob: "2008-02-19",
        gender: "MALE",
        classId: testClassId,
        status: "ACTIVE",
        guardianName: "Alfred Pennyworth",
        guardianPhone: "+1-555-0001",
        guardianEmail: "alfred@manor.org",
      },
      testActorId,
    );

    const deleteResult = await deleteStudent(created.id, testActorId);
    expect(deleteResult.success).toBe(true);

    // 1. Verify student document is completely removed from DB
    const studentInDb = await Student.findById(created.id);
    expect(studentInDb).toBeNull();

    // 2. Verify audit log entry exists with exact metadata and actorId
    const auditLogs = await AuditLog.find({ targetId: created.id });
    expect(auditLogs.length).toBe(1);

    const log = auditLogs[0];
    expect(log.action).toBe("DELETE_STUDENT");
    expect(log.targetType).toBe("STUDENT");
    expect(log.actorId.toString()).toBe(testActorId);
    expect(log.meta).toMatchObject({
      studentId: "STU-AUDIT-DEL-01",
      name: "Bruce Wayne",
      classId: testClassId,
    });
  });

  it("throws BadRequestError on malformed IDs", async () => {
    await expect(getStudentById("invalid-id")).rejects.toThrow(BadRequestError);
    await expect(updateStudent("invalid-id", {})).rejects.toThrow(BadRequestError);
    await expect(deleteStudent("invalid-id", testActorId)).rejects.toThrow(BadRequestError);
  });
});
