import mongoose from "mongoose";
import { Class } from "@/server/models/class";
import { Student } from "@/server/models/student";
import { connectToDatabase } from "@/server/db";
import { CreateClassInput, UpdateClassInput } from "@/validations/class";
import { BadRequestError, ConflictError, NotFoundError } from "@/server/http";
import { ClassWithCounts } from "@/types/class";

export type { ClassWithCounts };

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function listClasses(): Promise<ClassWithCounts[]> {
  await connectToDatabase();

  const [classes, counts] = await Promise.all([
    Class.find().sort({ gradeLevel: 1, name: 1 }).lean(),
    Student.aggregate<{ _id: mongoose.Types.ObjectId; count: number; activeCount: number }>([
      {
        $group: {
          _id: "$classId",
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const countsMap = new Map<string, { count: number; activeCount: number }>();
  for (const c of counts) {
    if (c._id) {
      countsMap.set(c._id.toString(), {
        count: c.count,
        activeCount: c.activeCount,
      });
    }
  }

  return classes.map((cls) => {
    const classId = cls._id.toString();
    const stats = countsMap.get(classId) || { count: 0, activeCount: 0 };

    return {
      id: classId,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      capacity: cls.capacity,
      homeroomTeacherName: cls.homeroomTeacherName,
      enrolledCount: stats.count,
      activeCount: stats.activeCount,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
    };
  });
}

export async function getClassById(id: string): Promise<ClassWithCounts> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid class ID format");
  }

  const cls = await Class.findById(id).lean();
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  const [totalCount, activeCount] = await Promise.all([
    Student.countDocuments({ classId: id }),
    Student.countDocuments({ classId: id, status: "ACTIVE" }),
  ]);

  return {
    id: cls._id.toString(),
    name: cls.name,
    gradeLevel: cls.gradeLevel,
    capacity: cls.capacity,
    homeroomTeacherName: cls.homeroomTeacherName,
    enrolledCount: totalCount,
    activeCount,
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
  };
}

export async function createClass(input: CreateClassInput) {
  await connectToDatabase();

  const existing = await Class.findOne({
    name: new RegExp(`^${escapeRegex(input.name.trim())}$`, "i"),
  });
  if (existing) {
    throw new ConflictError("A class with this name already exists");
  }

  const newClass = await Class.create({
    name: input.name.trim(),
    gradeLevel: input.gradeLevel.trim(),
    capacity: input.capacity,
    homeroomTeacherName: input.homeroomTeacherName.trim(),
  });

  return {
    id: newClass._id.toString(),
    name: newClass.name,
    gradeLevel: newClass.gradeLevel,
    capacity: newClass.capacity,
    homeroomTeacherName: newClass.homeroomTeacherName,
    enrolledCount: 0,
    activeCount: 0,
    createdAt: newClass.createdAt,
    updatedAt: newClass.updatedAt,
  };
}

export async function updateClass(id: string, input: UpdateClassInput) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid class ID format");
  }

  const cls = await Class.findById(id);
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  if (input.name && input.name.trim() !== cls.name) {
    const existing = await Class.findOne({
      _id: mongoose.trusted({ $ne: id }),
      name: new RegExp(`^${escapeRegex(input.name.trim())}$`, "i"),
    });
    if (existing) {
      throw new ConflictError("A class with this name already exists");
    }
    cls.name = input.name.trim();
  }

  if (input.gradeLevel) cls.gradeLevel = input.gradeLevel.trim();
  if (input.capacity !== undefined) cls.capacity = input.capacity;
  if (input.homeroomTeacherName) cls.homeroomTeacherName = input.homeroomTeacherName.trim();

  await cls.save();

  return getClassById(id);
}

export async function deleteClass(id: string): Promise<{ success: boolean; message: string }> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid class ID format");
  }

  const cls = await Class.findById(id);
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  // Critical Domain Rule: A class cannot be deleted while any student still references it
  const studentCount = await Student.countDocuments({ classId: id });
  if (studentCount > 0) {
    throw new BadRequestError(
      `Cannot delete class "${cls.name}": ${studentCount} student(s) are currently enrolled in it. Please reassign those students first.`,
    );
  }

  await Class.findByIdAndDelete(id);

  return {
    success: true,
    message: `Class "${cls.name}" was successfully deleted.`,
  };
}
