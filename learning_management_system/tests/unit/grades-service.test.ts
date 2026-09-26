import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/server/models/user";
import { Course } from "@/server/models/course";
import { Category } from "@/server/models/category";
import { Quiz } from "@/server/models/quiz";
import { QuizAttempt } from "@/server/models/quiz-attempt";
import { Assignment } from "@/server/models/assignment";
import { Submission } from "@/server/models/submission";
import { Enrollment } from "@/server/models/enrollment";
import {
  calculateLetterGrade,
  getStudentGrades,
} from "@/server/services/grades";

describe("Grades Calculation & Student Transcripts", () => {
  let mongoServer: MongoMemoryServer;
  let instructor: any;
  let student: any;
  let category: any;
  let course: any;
  let quiz: any;
  let assignment: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Category.deleteMany({});
    await Quiz.deleteMany({});
    await QuizAttempt.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Enrollment.deleteMany({});

    instructor = await User.create({
      name: "Prof. Alan Grant",
      email: "grant@lms.local",
      passwordHash: "hash-grant",
      role: "INSTRUCTOR",
      status: "ACTIVE",
      isDemo: false,
    });

    student = await User.create({
      name: "Tim Murphy",
      email: "tim@lms.local",
      passwordHash: "hash-tim",
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
    });

    category = await Category.create({
      name: "Paleontology",
      slug: "paleontology",
    });

    course = await Course.create({
      title: "Vertebrate Fossil Taxonomy",
      slug: "vertebrate-fossil-taxonomy",
      summary: "Classifying fossil specimens.",
      instructorId: instructor._id,
      categoryId: category._id,
      status: "PUBLISHED",
      level: "INTERMEDIATE",
    });

    quiz = await Quiz.create({
      courseId: course._id,
      title: "Cretaceous Era Midterm",
      passingPct: 70,
      questions: [
        {
          id: "q1",
          prompt: "Which era came first?",
          type: "SINGLE",
          points: 100,
          options: [
            { id: "o1", text: "Triassic", isCorrect: true },
            { id: "o2", text: "Cretaceous", isCorrect: false },
          ],
        },
      ],
    });

    assignment = await Assignment.create({
      courseId: course._id,
      title: "Field Excavation Report",
      maxPoints: 100,
      instructions: "Document field findings.",
    });

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "ACTIVE",
      progressPct: 50,
    });
  });

  it("should compute letter grades correctly according to percentage scale", () => {
    expect(calculateLetterGrade(null)).toBe("N/A");
    expect(calculateLetterGrade(95)).toBe("A");
    expect(calculateLetterGrade(91)).toBe("A-");
    expect(calculateLetterGrade(88)).toBe("B+");
    expect(calculateLetterGrade(84)).toBe("B");
    expect(calculateLetterGrade(81)).toBe("B-");
    expect(calculateLetterGrade(78)).toBe("C+");
    expect(calculateLetterGrade(74)).toBe("C");
    expect(calculateLetterGrade(70)).toBe("C-");
    expect(calculateLetterGrade(65)).toBe("D");
    expect(calculateLetterGrade(45)).toBe("F");
  });

  it("should aggregate quiz scores, assignment grades, and cumulative course percentages", async () => {
    // 1. Student takes quiz and scores 90/100
    await QuizAttempt.create({
      userId: student._id,
      courseId: course._id,
      quizId: quiz._id,
      attemptNo: 1,
      score: 90,
      maxScore: 100,
      percentage: 90,
      passed: true,
      submittedAt: new Date(),
    });

    // 2. Student submits assignment and receives 80/100
    await Submission.create({
      userId: student._id,
      courseId: course._id,
      assignmentId: assignment._id,
      status: "GRADED",
      grade: 80,
      feedback: "Great excavation notes!",
      submittedAt: new Date(),
    });

    const grades = await getStudentGrades(student._id.toString());
    expect(grades.length).toBe(1);

    const courseGrade = grades[0];
    expect(courseGrade.courseTitle).toBe("Vertebrate Fossil Taxonomy");
    expect(courseGrade.totalPossiblePoints).toBe(200); // 100 (quiz) + 100 (assignment)
    expect(courseGrade.totalEarnedPoints).toBe(170); // 90 + 80
    expect(courseGrade.overallPercentage).toBe(85); // 170 / 200 = 85%
    expect(courseGrade.letterGrade).toBe("B");

    // Quizzes breakdown
    expect(courseGrade.quizzes.length).toBe(1);
    expect(courseGrade.quizzes[0].score).toBe(90);
    expect(courseGrade.quizzes[0].passed).toBe(true);

    // Assignments breakdown
    expect(courseGrade.assignments.length).toBe(1);
    expect(courseGrade.assignments[0].grade).toBe(80);
    expect(courseGrade.assignments[0].feedback).toBe("Great excavation notes!");
  });

  it("should handle courses with no graded submissions gracefully", async () => {
    const grades = await getStudentGrades(student._id.toString());
    expect(grades.length).toBe(1);

    const courseGrade = grades[0];
    expect(courseGrade.totalPossiblePoints).toBe(200);
    expect(courseGrade.totalEarnedPoints).toBe(0);
    expect(courseGrade.overallPercentage).toBeNull();
    expect(courseGrade.letterGrade).toBe("N/A");
  });
});
