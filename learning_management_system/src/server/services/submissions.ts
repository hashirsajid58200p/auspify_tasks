import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Assignment } from "@/server/models/assignment";
import { Submission } from "@/server/models/submission";
import { Enrollment } from "@/server/models/enrollment";
import { CurrentUser } from "@/server/auth/session";
import { assertCourseOwner } from "@/server/policies/ownership";
import { canAccessCourseContent } from "@/server/policies/course-access";
import { recalculateProgress } from "@/server/services/progress";
import { NotFoundError, BadRequestError } from "@/server/http";

export async function submitAssignment(
  user: CurrentUser,
  assignmentId: string,
  text?: string,
  linkUrl?: string
) {
  if (!Types.ObjectId.isValid(assignmentId)) {
    throw new NotFoundError("Assignment not found");
  }

  await connectToDatabase();

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  const course = await Course.findById(assignment.courseId);
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
    throw new NotFoundError("Assignment not found");
  }

  const now = new Date();
  let isLate = false;

  if (assignment.dueAt && now > assignment.dueAt) {
    if (!assignment.allowLate) {
      throw new BadRequestError(
        "Submissions are closed for this assignment (late submissions not permitted)."
      );
    }
    isLate = true;
  }

  const userOid = new Types.ObjectId(user.userId);
  let submission = await Submission.findOne({
    assignmentId: assignment._id,
    userId: userOid,
  });

  if (submission) {
    if (submission.status === "GRADED") {
      throw new BadRequestError(
        "Cannot resubmit after assignment has already been graded."
      );
    }

    submission.text = text || "";
    submission.linkUrl = linkUrl || undefined;
    submission.isLate = isLate;
    submission.submittedAt = now;
    await submission.save();
  } else {
    submission = await Submission.create({
      assignmentId: assignment._id,
      courseId: course._id,
      userId: userOid,
      text: text || "",
      linkUrl: linkUrl || undefined,
      isLate,
      status: "SUBMITTED",
      submittedAt: now,
    });
  }

  // Hook into progress recalculation
  if (assignment.isRequired) {
    await recalculateProgress(user.userId, course._id.toString());
  }

  return submission.toObject();
}

export async function gradeSubmission(
  instructorUser: CurrentUser,
  submissionId: string,
  grade: number,
  feedback?: string
) {
  if (!Types.ObjectId.isValid(submissionId)) {
    throw new NotFoundError("Submission not found");
  }

  await connectToDatabase();

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new NotFoundError("Submission not found");
  }

  const assignment = await Assignment.findById(submission.assignmentId);
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  const course = await Course.findById(submission.courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, instructorUser.userId);

  // Clamp grade to 0..maxPoints
  const clampedGrade = Math.max(0, Math.min(assignment.maxPoints, Math.round(grade)));

  submission.grade = clampedGrade;
  submission.feedback = feedback ? feedback.trim() : "";
  submission.status = "GRADED";
  submission.gradedAt = new Date();
  submission.gradedBy = new Types.ObjectId(instructorUser.userId);
  await submission.save();

  return submission.toObject();
}

export async function getCourseSubmissionsQueue(
  instructorUser: CurrentUser,
  courseId: string
) {
  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, instructorUser.userId);

  const rawSubmissions = await Submission.find({ courseId: course._id })
    .sort({ submittedAt: -1 })
    .populate("assignmentId", "title maxPoints")
    .populate("userId", "name email")
    .lean();

  return rawSubmissions.map((s) => {
    const asgn = s.assignmentId as unknown as { _id: Types.ObjectId; title: string; maxPoints: number } | null;
    const student = s.userId as unknown as { _id: Types.ObjectId; name: string; email: string } | null;

    return {
      _id: s._id.toString(),
      assignment: asgn
        ? { _id: asgn._id.toString(), title: asgn.title, maxPoints: asgn.maxPoints }
        : null,
      student: student
        ? { _id: student._id.toString(), name: student.name, email: student.email }
        : null,
      text: s.text || "",
      linkUrl: s.linkUrl || null,
      isLate: s.isLate,
      status: s.status,
      grade: s.grade ?? null,
      feedback: s.feedback || "",
      submittedAt: s.submittedAt.toISOString(),
      gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null,
    };
  });
}
