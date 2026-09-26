import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Category } from "@/server/models/category";
import { Course } from "@/server/models/course";
import { Quiz } from "@/server/models/quiz";
import { QuizAttempt } from "@/server/models/quiz-attempt";
import { Enrollment } from "@/server/models/enrollment";
import { User } from "@/server/models/user";
import { CurrentUser } from "@/server/auth/session";
import {
  createQuiz,
  getQuizForStudent,
  deleteQuiz,
} from "@/server/services/quizzes";
import {
  startOrResumeAttempt,
  submitQuizAttempt,
  getAttemptResult,
} from "@/server/services/attempts";
import { NotFoundError, BadRequestError } from "@/server/http";

describe("Quiz Service & Server-Authoritative Evaluation", () => {
  let mongoServer: MongoMemoryServer;
  let category: any;
  let instructor: any;
  let student: any;
  let course: any;

  const instructorUser: CurrentUser = {
    userId: "",
    email: "instructor@lms.local",
    name: "Instructor Isaac",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    isDemo: false,
  };

  const studentUser: CurrentUser = {
    userId: "",
    email: "student@lms.local",
    name: "Student Sam",
    role: "STUDENT",
    status: "ACTIVE",
    isDemo: false,
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    instructor = await User.create({
      name: "Instructor Isaac",
      email: "instructor@lms.local",
      passwordHash: "hash123",
      role: "INSTRUCTOR",
      status: "ACTIVE",
    });
    instructorUser.userId = instructor._id.toString();

    student = await User.create({
      name: "Student Sam",
      email: "student@lms.local",
      passwordHash: "hash123",
      role: "STUDENT",
      status: "ACTIVE",
    });
    studentUser.userId = student._id.toString();

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
    await Quiz.deleteMany({});
    await QuizAttempt.deleteMany({});
    await Enrollment.deleteMany({});

    course = await Course.create({
      instructorId: instructor._id,
      title: "Data Structures & Systems",
      slug: "data-structures-systems",
      summary: "Trees and graphs",
      categoryId: category._id,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
    });

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "ACTIVE",
    });
  });

  it("should create quiz with questions and prevent isCorrect leaks to students", async () => {
    const quiz = await createQuiz(instructorUser, course._id.toString(), {
      title: "Trees & Hash Tables Quiz",
      description: "Test your hash table knowledge",
      timeLimitMin: 15,
      passingPct: 70,
      maxAttempts: 2,
      shuffle: false,
      showAnswers: "AFTER_SUBMIT",
      isRequired: true,
      questions: [
        {
          id: "q1",
          type: "SINGLE",
          prompt: "What is the average lookup time of a hash table?",
          points: 10,
          explanation: "Hash tables achieve O(1) average lookup.",
          options: [
            { id: "opt1", text: "O(1)", isCorrect: true },
            { id: "opt2", text: "O(n)", isCorrect: false },
            { id: "opt3", text: "O(log n)", isCorrect: false },
          ],
        },
      ],
    });

    expect(quiz._id).toBeDefined();

    // Student fetches the quiz
    const studentView = await getQuizForStudent(studentUser, quiz._id.toString());
    expect(studentView.quiz.title).toBe("Trees & Hash Tables Quiz");
    expect(studentView.quiz.questions).toHaveLength(1);

    // SECURITY VERIFICATION: isCorrect and explanation MUST NEVER reach the student payload!
    const q1 = studentView.quiz.questions[0] as any;
    expect(q1.explanation).toBeUndefined();
    for (const opt of q1.options) {
      expect(opt.isCorrect).toBeUndefined();
    }
  });

  it("should start and resume attempts, and enforce maxAttempts limit", async () => {
    const quiz = await createQuiz(instructorUser, course._id.toString(), {
      title: "Binary Trees Evaluation",
      maxAttempts: 1,
      passingPct: 80,
      questions: [
        {
          id: "q1",
          type: "TRUE_FALSE",
          prompt: "A binary tree has at most 2 children per node.",
          points: 10,
          options: [
            { id: "t", text: "True", isCorrect: true },
            { id: "f", text: "False", isCorrect: false },
          ],
        },
      ],
    });

    // 1st start
    const attempt1 = await startOrResumeAttempt(studentUser, quiz._id.toString());
    expect(attempt1.attemptNo).toBe(1);
    expect(attempt1.resumed).toBe(false);

    // Starting again while in progress should RESUME
    const resume = await startOrResumeAttempt(studentUser, quiz._id.toString());
    expect(resume.attemptId).toBe(attempt1.attemptId);
    expect(resume.resumed).toBe(true);

    // Submit attempt 1
    await submitQuizAttempt(studentUser, attempt1.attemptId, [
      { questionId: "q1", selectedOptionIds: ["t"] },
    ]);

    // Now attempt limit of 1 should block any new attempt
    await expect(
      startOrResumeAttempt(studentUser, quiz._id.toString())
    ).rejects.toThrow(BadRequestError);
  });

  it("should correctly grade SINGLE, MULTIPLE (all-or-nothing), and TRUE_FALSE questions", async () => {
    const quiz = await createQuiz(instructorUser, course._id.toString(), {
      title: "Comprehensive Quiz",
      passingPct: 75,
      questions: [
        {
          id: "q1",
          type: "SINGLE",
          prompt: "Single choice prompt",
          points: 10,
          options: [
            { id: "o1", text: "Correct", isCorrect: true },
            { id: "o2", text: "Wrong", isCorrect: false },
          ],
        },
        {
          id: "q2",
          type: "MULTIPLE",
          prompt: "Select all prime numbers",
          points: 20,
          options: [
            { id: "p2", text: "2", isCorrect: true },
            { id: "p3", text: "3", isCorrect: true },
            { id: "p4", text: "4", isCorrect: false },
          ],
        },
        {
          id: "q3",
          type: "TRUE_FALSE",
          prompt: "TypeScript has static types",
          points: 10,
          options: [
            { id: "tf1", text: "True", isCorrect: true },
            { id: "tf2", text: "False", isCorrect: false },
          ],
        },
      ],
    });

    // Start attempt
    const attempt = await startOrResumeAttempt(studentUser, quiz._id.toString());

    // Submit with:
    // q1: correct (10/10)
    // q2: partially correct [p2] only -> all-or-nothing fails (0/20)
    // q3: correct (10/10)
    // Total score: 20/40 = 50% (< 75% -> passed: false)
    const result = await submitQuizAttempt(studentUser, attempt.attemptId, [
      { questionId: "q1", selectedOptionIds: ["o1"] },
      { questionId: "q2", selectedOptionIds: ["p2"] },
      { questionId: "q3", selectedOptionIds: ["tf1"] },
    ]);

    expect(result.score).toBe(20);
    expect(result.maxScore).toBe(40);
    expect(result.percentage).toBe(50);
    expect(result.passed).toBe(false);

    // Verify answers review revealed because showAnswers is AFTER_SUBMIT
    expect(result.review).toBeDefined();
    expect(result.review![0].options[0].isCorrect).toBe(true);
  });

  it("should mark attempt as EXPIRED when submitted after time limit plus 10s grace", async () => {
    const quiz = await createQuiz(instructorUser, course._id.toString(), {
      title: "Timed Quiz",
      timeLimitMin: 1, // 1 minute
      questions: [
        {
          id: "q1",
          type: "SINGLE",
          prompt: "Fast question",
          points: 5,
          options: [
            { id: "a", text: "A", isCorrect: true },
            { id: "b", text: "B", isCorrect: false },
          ],
        },
      ],
    });

    const attempt = await startOrResumeAttempt(studentUser, quiz._id.toString());

    // Artificially simulate that expiresAt was 2 minutes ago
    await QuizAttempt.findByIdAndUpdate(attempt.attemptId, {
      expiresAt: new Date(Date.now() - 120000),
    });

    const submitRes = await submitQuizAttempt(studentUser, attempt.attemptId, [
      { questionId: "q1", selectedOptionIds: ["a"] },
    ]);

    expect(submitRes.status).toBe("EXPIRED");
    expect(submitRes.score).toBe(0);
    expect(submitRes.passed).toBe(false);
  });

  it("should prevent deleting a quiz that has student attempts", async () => {
    const quiz = await createQuiz(instructorUser, course._id.toString(), {
      title: "Permanent Quiz",
      questions: [
        {
          id: "q1",
          type: "TRUE_FALSE",
          prompt: "Statement",
          points: 1,
          options: [
            { id: "t", text: "True", isCorrect: true },
            { id: "f", text: "False", isCorrect: false },
          ],
        },
      ],
    });

    await startOrResumeAttempt(studentUser, quiz._id.toString());

    await expect(
      deleteQuiz(instructorUser, course._id.toString(), quiz._id.toString())
    ).rejects.toThrow(BadRequestError);
  });
});
