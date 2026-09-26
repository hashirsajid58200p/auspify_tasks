import mongoose from "mongoose";
import { Student } from "@/server/models/student";
import { Class } from "@/server/models/class";
import { connectToDatabase } from "@/server/db";

export interface DashboardMetrics {
  totals: {
    students: number;
    classes: number;
    capacity: number;
    utilizationPercent: number;
  };
  byStatus: {
    active: number;
    inactive: number;
    graduated: number;
    transferred: number;
  };
  byClass: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    capacity: number;
    enrolledCount: number;
    activeCount: number;
    utilizationPercent: number;
  }>;
  recentStudents: Array<{
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    className?: string;
    classGradeLevel?: string;
    status: string;
    enrollmentDate: Date;
    photoUrl?: string;
  }>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await connectToDatabase();

  const [classes, studentStatusCounts, studentClassCounts, recentStudentsList] = await Promise.all([
    Class.find().sort({ gradeLevel: 1, name: 1 }).lean(),
    Student.aggregate<{ _id: string; count: number }>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
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
    Student.find()
      .select(
        "_id studentId firstName lastName gender classId status enrollmentDate photoUrl createdAt",
      )
      .populate<{ classId: { _id: mongoose.Types.ObjectId; name: string; gradeLevel: string } }>(
        "classId",
        "name gradeLevel",
        Class,
      )
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const statusMap: Record<string, number> = {
    ACTIVE: 0,
    INACTIVE: 0,
    GRADUATED: 0,
    TRANSFERRED: 0,
  };
  for (const s of studentStatusCounts) {
    if (s._id in statusMap) {
      statusMap[s._id] = s.count;
    }
  }

  const classCountsMap = new Map<string, { count: number; activeCount: number }>();
  for (const c of studentClassCounts) {
    if (c._id) {
      classCountsMap.set(c._id.toString(), {
        count: c.count,
        activeCount: c.activeCount,
      });
    }
  }

  let totalCapacity = 0;
  let totalEnrolled = 0;

  const byClass = classes.map((cls) => {
    const classId = cls._id.toString();
    const stats = classCountsMap.get(classId) || { count: 0, activeCount: 0 };
    totalCapacity += cls.capacity;
    totalEnrolled += stats.count;

    const utilizationPercent =
      cls.capacity > 0 ? Math.min(100, Math.round((stats.count / cls.capacity) * 100)) : 0;

    return {
      id: classId,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      capacity: cls.capacity,
      enrolledCount: stats.count,
      activeCount: stats.activeCount,
      utilizationPercent,
    };
  });

  const overallUtilization =
    totalCapacity > 0 ? Math.min(100, Math.round((totalEnrolled / totalCapacity) * 100)) : 0;

  const totalStudents = Object.values(statusMap).reduce((a, b) => a + b, 0);

  const recentStudents = recentStudentsList.map((s) => {
    const classObj = s.classId as unknown as
      { _id?: mongoose.Types.ObjectId; name?: string; gradeLevel?: string } | undefined;

    return {
      id: s._id.toString(),
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      className: classObj?.name,
      classGradeLevel: classObj?.gradeLevel,
      status: s.status,
      enrollmentDate: s.enrollmentDate,
      photoUrl: s.photoUrl,
    };
  });

  return {
    totals: {
      students: totalStudents,
      classes: classes.length,
      capacity: totalCapacity,
      utilizationPercent: overallUtilization,
    },
    byStatus: {
      active: statusMap.ACTIVE,
      inactive: statusMap.INACTIVE,
      graduated: statusMap.GRADUATED,
      transferred: statusMap.TRANSFERRED,
    },
    byClass,
    recentStudents,
  };
}
