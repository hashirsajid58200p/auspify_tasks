import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Course } from "@/server/models/course";
import { Assignment, IAssignment } from "@/server/models/assignment";
import { Submission } from "@/server/models/submission";
import { Enrollment } from "@/server/models/enrollment";
import { CurrentUser } from "@/server/auth/session";
import { assertCourseOwner } from "@/server/policies/ownership";
import { canAccessCourseContent } from "@/server/policies/course-access";
import { NotFoundError, BadRequestError } from "@/server/http";
import {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
} from "@/validations/assignment";

export async function createAssignment(
  user: CurrentUser,
  courseId: string,
  data: CreateAssignmentSchema
) {
  if (!Types.ObjectId.isValid(courseId)) {
    throw new NotFoundError("Course not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  const assignment = await Assignment.create({
    courseId: course._id,
    moduleId: data.moduleId ? new Types.ObjectId(data.moduleId) : undefined,
    title: data.title,
    instructions: data.instructions,
    dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
    maxPoints: data.maxPoints,
    allowLate: data.allowLate,
    isRequired: data.isRequired,
  });

  return assignment.toObject();
}

export async function updateAssignment(
  user: CurrentUser,
  courseId: string,
  assignmentId: string,
  data: UpdateAssignmentSchema
) {
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(assignmentId)) {
    throw new NotFoundError("Assignment not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  const assignment = await Assignment.findOne({
    _id: new Types.ObjectId(assignmentId),
    courseId: course._id,
  });

  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  if (data.title !== undefined) assignment.title = data.title;
  if (data.instructions !== undefined) assignment.instructions = data.instructions;
  if (data.moduleId !== undefined) {
    assignment.moduleId = data.moduleId ? new Types.ObjectId(data.moduleId) : undefined;
  }
  if (data.dueAt !== undefined) {
    assignment.dueAt = data.dueAt ? new Date(data.dueAt) : undefined;
  }
  if (data.maxPoints !== undefined) assignment.maxPoints = data.maxPoints;
  if (data.allowLate !== undefined) assignment.allowLate = data.allowLate;
  if (data.isRequired !== undefined) assignment.isRequired = data.isRequired;

  await assignment.save();
  return assignment.toObject();
}

export async function deleteAssignment(
  user: CurrentUser,
  courseId: string,
  assignmentId: string
) {
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(assignmentId)) {
    throw new NotFoundError("Assignment not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  const assignment = await Assignment.findOne({
    _id: new Types.ObjectId(assignmentId),
    courseId: course._id,
  });

  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  // Check if any student has submitted to this assignment
  const hasSubmissions = await Submission.exists({ assignmentId: assignment._id });
  if (hasSubmissions) {
    throw new BadRequestError(
      "Cannot delete an assignment that already has student submissions."
    );
  }

  await Assignment.deleteOne({ _id: assignment._id });
  return { success: true };
}

export async function getAssignmentForInstructor(
  user: CurrentUser,
  courseId: string,
  assignmentId: string
) {
  if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(assignmentId)) {
    throw new NotFoundError("Assignment not found");
  }

  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  assertCourseOwner(course.instructorId, user.userId);

  const assignment = await Assignment.findOne({
    _id: new Types.ObjectId(assignmentId),
    courseId: course._id,
  }).lean();

  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  return assignment;
}

export async function listAssignmentsForInstructor(
  user: CurrentUser,
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

  assertCourseOwner(course.instructorId, user.userId);

  return Assignment.find({ courseId: course._id }).sort({ createdAt: 1 }).lean();
}

export async function getAssignmentForStudent(
  user: CurrentUser,
  assignmentId: string
) {
  if (!Types.ObjectId.isValid(assignmentId)) {
    throw new NotFoundError("Assignment not found");
  }

  await connectToDatabase();

  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  const course = await Course.findById(assignment.courseId).lean();
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

  const submission = await Submission.findOne({
    assignmentId: assignment._id,
    userId: new Types.ObjectId(user.userId),
  }).lean();

  return {
    assignment: {
      _id: assignment._id.toString(),
      courseId: assignment.courseId.toString(),
      moduleId: assignment.moduleId ? assignment.moduleId.toString() : null,
      title: assignment.title,
      instructions: assignment.instructions,
      dueAt: assignment.dueAt ? assignment.dueAt.toISOString() : null,
      maxPoints: assignment.maxPoints,
      allowLate: assignment.allowLate,
      isRequired: assignment.isRequired,
    },
    course: {
      _id: course._id.toString(),
      title: course.title,
      slug: course.slug,
    },
    submission: submission
      ? {
          _id: submission._id.toString(),
          text: submission.text || "",
          linkUrl: submission.linkUrl || null,
          isLate: submission.isLate,
          status: submission.status,
          grade: submission.grade ?? null,
          feedback: submission.feedback || "",
          submittedAt: submission.submittedAt.toISOString(),
          gradedAt: submission.gradedAt ? submission.gradedAt.toISOString() : null,
        }
      : null,
  };
}
