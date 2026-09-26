import mongoose from "mongoose";
import { Student } from "@/server/models/student";
import { Class } from "@/server/models/class";
import { AuditLog } from "@/server/models/audit-log";
import { connectToDatabase } from "@/server/db";
import { CreateStudentInput, UpdateStudentInput, StudentQueryInput } from "@/validations/student";
import { BadRequestError, ConflictError, NotFoundError } from "@/server/http";
import { StudentListItem, StudentDetail } from "@/types/student";

export type { StudentListItem, StudentDetail };

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function listStudents(query: Partial<StudentQueryInput>): Promise<{
  students: StudentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};

  if (query.q && query.q.trim()) {
    const regex = new RegExp(escapeRegex(query.q.trim()), "i");
    filter.$or = [{ studentId: regex }, { firstName: regex }, { lastName: regex }];
  }

  if (query.classId && mongoose.Types.ObjectId.isValid(query.classId)) {
    filter.classId = new mongoose.Types.ObjectId(query.classId);
  }

  if (query.status) {
    filter.status = query.status;
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    "-createdAt": { createdAt: -1 },
    createdAt: { createdAt: 1 },
    lastName: { lastName: 1, firstName: 1 },
    "-lastName": { lastName: -1, firstName: -1 },
    studentId: { studentId: 1 },
    "-studentId": { studentId: -1 },
    enrollmentDate: { enrollmentDate: 1 },
    "-enrollmentDate": { enrollmentDate: -1 },
    status: { status: 1 },
    "-status": { status: -1 },
  };

  const sortOption = (query.sort && sortMap[query.sort]) || { createdAt: -1 };
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  // Strict PII projection: do not select dob, address, guardian contact details, phone, email, notes
  const [students, total] = await Promise.all([
    Student.find(filter)
      .select(
        "_id studentId firstName lastName gender classId status enrollmentDate photoUrl createdAt updatedAt",
      )
      .populate<{ classId: { _id: mongoose.Types.ObjectId; name: string; gradeLevel: string } }>(
        "classId",
        "name gradeLevel",
        Class,
      )
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);

  const items: StudentListItem[] = students.map((s) => {
    const classObj = s.classId as unknown as
      { _id?: mongoose.Types.ObjectId; name?: string; gradeLevel?: string } | undefined;
    return {
      id: s._id.toString(),
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender,
      classId: classObj?._id ? classObj._id.toString() : s.classId.toString(),
      className: classObj?.name,
      classGradeLevel: classObj?.gradeLevel,
      status: s.status,
      enrollmentDate: s.enrollmentDate,
      photoUrl: s.photoUrl,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  });

  return {
    students: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getStudentById(id: string): Promise<StudentDetail> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid student ID format");
  }

  const s = await Student.findById(id)
    .populate<{
      classId: {
        _id: mongoose.Types.ObjectId;
        name: string;
        gradeLevel: string;
        homeroomTeacherName: string;
      };
    }>("classId", "name gradeLevel homeroomTeacherName", Class)
    .lean();

  if (!s) {
    throw new NotFoundError("Student not found");
  }

  const classObj = s.classId as unknown as {
    _id: mongoose.Types.ObjectId;
    name: string;
    gradeLevel: string;
    homeroomTeacherName: string;
  } | null;

  return {
    id: s._id.toString(),
    studentId: s.studentId,
    firstName: s.firstName,
    lastName: s.lastName,
    dob: s.dob,
    gender: s.gender,
    classId: classObj ? classObj._id.toString() : s.classId.toString(),
    class: classObj
      ? {
          id: classObj._id.toString(),
          name: classObj.name,
          gradeLevel: classObj.gradeLevel,
          homeroomTeacherName: classObj.homeroomTeacherName,
        }
      : undefined,
    enrollmentDate: s.enrollmentDate,
    status: s.status,
    guardianName: s.guardianName,
    guardianPhone: s.guardianPhone,
    guardianEmail: s.guardianEmail,
    phone: s.phone,
    email: s.email,
    address: s.address,
    photoUrl: s.photoUrl,
    notes: s.notes,
    createdBy: s.createdBy.toString(),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export async function createStudent(
  input: CreateStudentInput,
  actorId: string,
): Promise<StudentDetail> {
  await connectToDatabase();

  const existingStudent = await Student.findOne({
    studentId: new RegExp(`^${escapeRegex(input.studentId.trim())}$`, "i"),
  });
  if (existingStudent) {
    throw new ConflictError(`Student with ID "${input.studentId}" already exists`);
  }

  const targetClass = await Class.findById(input.classId);
  if (!targetClass) {
    throw new NotFoundError("Referenced class does not exist");
  }

  const created = await Student.create({
    studentId: input.studentId.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dob: new Date(input.dob),
    gender: input.gender,
    classId: new mongoose.Types.ObjectId(input.classId),
    enrollmentDate: input.enrollmentDate ? new Date(input.enrollmentDate) : new Date(),
    status: input.status || "ACTIVE",
    guardianName: input.guardianName.trim(),
    guardianPhone: input.guardianPhone.trim(),
    guardianEmail: input.guardianEmail.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    address: input.address?.trim() || undefined,
    photoUrl: input.photoUrl?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdBy: new mongoose.Types.ObjectId(actorId),
  });

  return getStudentById(created._id.toString());
}

export async function updateStudent(id: string, input: UpdateStudentInput): Promise<StudentDetail> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid student ID format");
  }

  const student = await Student.findById(id);
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  if (input.classId && input.classId !== student.classId.toString()) {
    const targetClass = await Class.findById(input.classId);
    if (!targetClass) {
      throw new NotFoundError("Referenced class does not exist");
    }
    student.classId = new mongoose.Types.ObjectId(input.classId);
  }

  if (input.firstName !== undefined) student.firstName = input.firstName.trim();
  if (input.lastName !== undefined) student.lastName = input.lastName.trim();
  if (input.dob !== undefined) student.dob = new Date(input.dob);
  if (input.gender !== undefined) student.gender = input.gender;
  if (input.enrollmentDate !== undefined) student.enrollmentDate = new Date(input.enrollmentDate);
  if (input.status !== undefined) student.status = input.status;
  if (input.guardianName !== undefined) student.guardianName = input.guardianName.trim();
  if (input.guardianPhone !== undefined) student.guardianPhone = input.guardianPhone.trim();
  if (input.guardianEmail !== undefined)
    student.guardianEmail = input.guardianEmail.trim().toLowerCase();
  if (input.phone !== undefined) student.phone = input.phone.trim() || undefined;
  if (input.email !== undefined) student.email = input.email.trim().toLowerCase() || undefined;
  if (input.address !== undefined) student.address = input.address.trim() || undefined;
  if (input.photoUrl !== undefined) student.photoUrl = input.photoUrl.trim() || undefined;
  if (input.notes !== undefined) student.notes = input.notes.trim() || undefined;

  await student.save();
  return getStudentById(id);
}

export async function deleteStudent(
  id: string,
  actorId: string,
): Promise<{ success: boolean; message: string }> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid student ID format");
  }

  const student = await Student.findById(id);
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  // Audit log entry MUST be created before student record is deleted
  await AuditLog.create({
    actorId: new mongoose.Types.ObjectId(actorId),
    action: "DELETE_STUDENT",
    targetType: "STUDENT",
    targetId: student._id.toString(),
    meta: {
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
      classId: student.classId.toString(),
      enrollmentDate: student.enrollmentDate,
      status: student.status,
    },
  });

  await Student.findByIdAndDelete(id);

  return {
    success: true,
    message: `Student "${student.firstName} ${student.lastName}" (${student.studentId}) was successfully deleted.`,
  };
}
