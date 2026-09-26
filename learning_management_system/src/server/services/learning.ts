import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Module } from "@/server/models/module";
import { Lesson } from "@/server/models/lesson";
import { Quiz } from "@/server/models/quiz";
import { QuizAttempt } from "@/server/models/quiz-attempt";
import { Assignment } from "@/server/models/assignment";
import { Submission } from "@/server/models/submission";
import { Enrollment } from "@/server/models/enrollment";
import { LessonProgress } from "@/server/models/lesson-progress";
import { CurrentUser } from "@/server/auth/session";
import { canAccessCourseContent } from "@/server/policies/course-access";
import { NotFoundError } from "@/server/http";

export interface LearningLessonItem {
  _id: string;
  moduleId: string;
  title: string;
  order: number;
  type: "VIDEO" | "TEXT";
  durationMin: number;
  isPreview: boolean;
  isCompleted: boolean;
}

export interface LearningQuizItem {
  _id: string;
  moduleId: string | null;
  title: string;
  timeLimitMin: number | null;
  passingPct: number;
  isRequired: boolean;
  questionCount: number;
  hasPassed: boolean;
}

export interface LearningAssignmentItem {
  _id: string;
  moduleId: string | null;
  title: string;
  maxPoints: number;
  dueAt: string | null;
  isRequired: boolean;
  isSubmitted: boolean;
  isGraded: boolean;
}

export interface LearningModuleItem {
  _id: string;
  title: string;
  order: number;
  lessons: LearningLessonItem[];
  quizzes: LearningQuizItem[];
  assignments: LearningAssignmentItem[];
}

export async function getCourseCurriculumForLearning(
  user: CurrentUser,
  courseIdOrSlug: string
) {
  await connectToDatabase();

  const isObjectId = Types.ObjectId.isValid(courseIdOrSlug);
  const course = isObjectId
    ? await Course.findById(courseIdOrSlug)
    : await Course.findOne({ slug: courseIdOrSlug.toLowerCase() });

  if (!course) {
    throw new NotFoundError("Course not found");
  }

  const enrollment = await Enrollment.findOne({
    userId: new Types.ObjectId(user.userId),
    courseId: course._id,
    status: { $in: ["ACTIVE", "COMPLETED"] },
  });

  const hasAccess = canAccessCourseContent(
    user,
    {
      courseStatus: course.status,
      instructorId: course.instructorId,
    },
    false,
    !!enrollment
  );

  if (!hasAccess) {
    throw new NotFoundError("Course not found");
  }

  const userOid = new Types.ObjectId(user.userId);

  const [
    rawModules,
    rawLessons,
    completedRecords,
    rawQuizzes,
    passedAttempts,
    rawAssignments,
    submissions,
  ] = await Promise.all([
    Module.find({ courseId: course._id }).sort({ order: 1 }).lean(),
    Lesson.find({ courseId: course._id })
      .sort({ order: 1 })
      .select("_id moduleId title order type durationMin isPreview")
      .lean(),
    LessonProgress.find({
      userId: userOid,
      courseId: course._id,
    })
      .select("lessonId")
      .lean(),
    Quiz.find({ courseId: course._id })
      .select("_id moduleId title timeLimitMin passingPct isRequired questions")
      .lean(),
    QuizAttempt.find({
      userId: userOid,
      courseId: course._id,
      passed: true,
    })
      .select("quizId")
      .lean(),
    Assignment.find({ courseId: course._id })
      .select("_id moduleId title maxPoints dueAt isRequired")
      .lean(),
    Submission.find({
      userId: userOid,
      courseId: course._id,
    })
      .select("assignmentId status")
      .lean(),
  ]);

  const completedSet = new Set(
    completedRecords.map((r) => r.lessonId.toString())
  );
  const passedQuizIds = new Set(
    passedAttempts.map((a) => a.quizId.toString())
  );
  const submittedAssignmentMap = new Map(
    submissions.map((s) => [s.assignmentId.toString(), s.status])
  );

  const lessonsByModule = new Map<string, typeof rawLessons>();
  for (const lesson of rawLessons) {
    const mId = lesson.moduleId.toString();
    if (!lessonsByModule.has(mId)) {
      lessonsByModule.set(mId, []);
    }
    lessonsByModule.get(mId)!.push(lesson);
  }

  const quizzesByModule = new Map<string, LearningQuizItem[]>();
  const courseQuizzes: LearningQuizItem[] = [];

  for (const q of rawQuizzes) {
    const item: LearningQuizItem = {
      _id: q._id.toString(),
      moduleId: q.moduleId ? q.moduleId.toString() : null,
      title: q.title,
      timeLimitMin: q.timeLimitMin || null,
      passingPct: q.passingPct,
      isRequired: q.isRequired,
      questionCount: q.questions?.length || 0,
      hasPassed: passedQuizIds.has(q._id.toString()),
    };
    if (q.moduleId) {
      const mId = q.moduleId.toString();
      if (!quizzesByModule.has(mId)) quizzesByModule.set(mId, []);
      quizzesByModule.get(mId)!.push(item);
    } else {
      courseQuizzes.push(item);
    }
  }

  const assignmentsByModule = new Map<string, LearningAssignmentItem[]>();
  const courseAssignments: LearningAssignmentItem[] = [];

  for (const a of rawAssignments) {
    const subStatus = submittedAssignmentMap.get(a._id.toString());
    const item: LearningAssignmentItem = {
      _id: a._id.toString(),
      moduleId: a.moduleId ? a.moduleId.toString() : null,
      title: a.title,
      maxPoints: a.maxPoints,
      dueAt: a.dueAt ? a.dueAt.toISOString() : null,
      isRequired: a.isRequired,
      isSubmitted: !!subStatus,
      isGraded: subStatus === "GRADED",
    };
    if (a.moduleId) {
      const mId = a.moduleId.toString();
      if (!assignmentsByModule.has(mId)) assignmentsByModule.set(mId, []);
      assignmentsByModule.get(mId)!.push(item);
    } else {
      courseAssignments.push(item);
    }
  }

  const modules: LearningModuleItem[] = rawModules.map((m) => {
    const mId = m._id.toString();
    return {
      _id: mId,
      title: m.title,
      order: m.order,
      lessons: (lessonsByModule.get(mId) || []).map((l) => ({
        _id: l._id.toString(),
        moduleId: l.moduleId.toString(),
        title: l.title,
        order: l.order,
        type: l.type as "VIDEO" | "TEXT",
        durationMin: l.durationMin || 0,
        isPreview: !!l.isPreview,
        isCompleted: completedSet.has(l._id.toString()),
      })),
      quizzes: quizzesByModule.get(mId) || [],
      assignments: assignmentsByModule.get(mId) || [],
    };
  });

  // Find first lesson if no lastLessonId
  let firstLessonId: string | null = null;
  for (const m of modules) {
    if (m.lessons.length > 0) {
      firstLessonId = m.lessons[0]._id;
      break;
    }
  }

  return {
    course: {
      _id: course._id.toString(),
      title: course.title,
      slug: course.slug,
      summary: course.summary,
      thumbnailUrl: course.thumbnailUrl || null,
      level: course.level,
    },
    modules,
    courseQuizzes,
    courseAssignments,
    progressPct: enrollment?.progressPct || 0,
    isCompleted: enrollment?.status === "COMPLETED",
    lastLessonId: enrollment?.lastLessonId
      ? enrollment.lastLessonId.toString()
      : firstLessonId,
  };
}

export async function getLessonContentForLearning(
  user: CurrentUser,
  lessonId: string
) {
  if (!Types.ObjectId.isValid(lessonId)) {
    throw new NotFoundError("Lesson not found");
  }

  await connectToDatabase();

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  const course = await Course.findById(lesson.courseId).lean();
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  const enrollment = await Enrollment.findOne({
    userId: new Types.ObjectId(user.userId),
    courseId: course._id,
    status: { $in: ["ACTIVE", "COMPLETED"] },
  });

  const hasAccess = canAccessCourseContent(
    user,
    {
      courseStatus: course.status,
      instructorId: course.instructorId,
    },
    lesson.isPreview,
    !!enrollment
  );

  if (!hasAccess) {
    throw new NotFoundError("Lesson not found");
  }

  const [completedRecord, allLessons] = await Promise.all([
    LessonProgress.findOne({
      userId: new Types.ObjectId(user.userId),
      lessonId: lesson._id,
    }).lean(),
    Lesson.find({ courseId: course._id })
      .sort({ order: 1 })
      .select("_id title")
      .lean(),
  ]);

  const currentIndex = allLessons.findIndex(
    (l) => l._id.toString() === lesson._id.toString()
  );
  const previousLesson =
    currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Update enrollment last accessed
  if (enrollment) {
    enrollment.lastLessonId = lesson._id;
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();
  }

  return {
    lesson: {
      _id: lesson._id.toString(),
      courseId: lesson.courseId.toString(),
      moduleId: lesson.moduleId.toString(),
      title: lesson.title,
      order: lesson.order,
      type: lesson.type,
      videoUrl: lesson.videoUrl || null,
      content: lesson.content || "",
      durationMin: lesson.durationMin || 0,
      isPreview: !!lesson.isPreview,
    },
    isCompleted: !!completedRecord,
    previousLesson: previousLesson
      ? { _id: previousLesson._id.toString(), title: previousLesson.title }
      : null,
    nextLesson: nextLesson
      ? { _id: nextLesson._id.toString(), title: nextLesson.title }
      : null,
    course: {
      _id: course._id.toString(),
      title: course.title,
      slug: course.slug,
    },
  };
}
