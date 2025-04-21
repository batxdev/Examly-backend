import { TestSubmission } from "../models/testSubmission.model.js";
import { Lecture } from "../models/lecture.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// Start a test (initialize a submission record)
export const startTest = async (req, res) => {
  try {
    const { testId, courseId } = req.body;
    const studentId = req.id;

    // Verify if the test exists
    const test = await Lecture.findOne({ _id: testId, isTest: true });
    if (!test) {
      throw new ApiError(404, "Test not found");
    }

    // Verify if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    // NOTE: We're no longer checking if the student has purchased the course
    // Tests are free for everyone

    // Check if the test has already been started
    let testSubmission = await TestSubmission.findOne({
      testId,
      courseId,
      studentId,
    });

    if (!testSubmission) {
      // Create a new submission record
      testSubmission = await TestSubmission.create({
        testId,
        courseId,
        studentId,
        startTime: new Date(),
        status: "started",
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, testSubmission, "Test started successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message || "Something went wrong while starting the test"
        )
      );
  }
};

// Submit a test
export const submitTest = async (req, res) => {
  try {
    const { testId, courseId, answers } = req.body;
    const studentId = req.id;

    console.log(
      `Processing test submission for test ${testId} by student ${studentId}`
    );

    // Verify if the test exists
    const test = await Lecture.findOne({ _id: testId, isTest: true });
    if (!test) {
      throw new ApiError(404, "Test not found");
    }

    // Find the existing submission record
    let testSubmission = await TestSubmission.findOne({
      testId,
      courseId,
      studentId,
    });

    if (!testSubmission) {
      // Create a new submission record if doesn't exist
      console.log("Creating new test submission record");
      testSubmission = await TestSubmission.create({
        testId,
        courseId,
        studentId,
        startTime: new Date(),
        status: "started",
      });
    }

    // Update submission with answers
    testSubmission.answers = answers;
    testSubmission.submitTime = new Date();
    testSubmission.status = "submitted";
    console.log(`Updating test submission with ${answers.length} answers`);

    // Auto-grade if possible (for single choice questions with correct answers)
    let totalScore = 0;
    for (let answer of testSubmission.answers) {
      // Find the corresponding question in the test
      const question = test.questions.find(
        (q) => q._id.toString() === answer.questionId.toString()
      );
      if (
        question &&
        question.correctAnswer &&
        answer.answer === question.correctAnswer
      ) {
        answer.score = 1; // Basic scoring, 1 point per correct answer
        totalScore += 1;
      }
    }

    testSubmission.totalScore = totalScore;
    await testSubmission.save();
    console.log(`Test submission saved with score: ${totalScore}`);

    // Mark test as viewed/completed in course progress
    const { CourseProgress } = await import("../models/courseProgress.js");

    // Find or create course progress record
    let courseProgress = await CourseProgress.findOne({
      courseId,
      userId: studentId,
    });

    if (!courseProgress) {
      console.log("Creating new course progress record");
      courseProgress = new CourseProgress({
        userId: studentId,
        courseId,
        completed: false,
        lectureProgress: [],
      });
    }

    // Check if the test is already marked as viewed in the progress
    const lectureIndex = courseProgress.lectureProgress.findIndex(
      (lecture) => lecture.lectureId === testId
    );

    if (lectureIndex !== -1) {
      // If lecture already exists, update its status
      console.log("Test already exists in progress, marking as viewed");
      courseProgress.lectureProgress[lectureIndex].viewed = true;
    } else {
      // Add new lecture progress
      console.log("Adding test to progress as viewed");
      courseProgress.lectureProgress.push({
        lectureId: testId,
        viewed: true,
      });
    }

    // Check if all lectures are completed
    const course = await Course.findById(courseId);
    const lectureProgressLength = courseProgress.lectureProgress.filter(
      (lectureProg) => lectureProg.viewed
    ).length;

    console.log(
      `Course progress: ${lectureProgressLength}/${course.lectures.length} lectures completed`
    );
    if (course.lectures.length === lectureProgressLength) {
      courseProgress.completed = true;
      console.log("All lectures completed, marking course as completed");
    }

    await courseProgress.save();
    console.log("Course progress updated successfully");

    return res
      .status(200)
      .json(
        new ApiResponse(200, testSubmission, "Test submitted successfully")
      );
  } catch (error) {
    console.error("Error submitting test:", error);
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message || "Something went wrong while submitting the test"
        )
      );
  }
};

// Get all submissions for a test (for instructors)
export const getTestSubmissions = async (req, res) => {
  try {
    const { testId } = req.params;
    const instructorId = req.id;

    // Verify if the test exists and the instructor owns it
    const test = await Lecture.findById(testId);
    if (!test) {
      throw new ApiError(404, "Test not found");
    }

    // Find the course that contains this test
    const course = await Course.findOne({
      lectures: testId,
      creator: instructorId,
    });

    if (!course) {
      throw new ApiError(
        403,
        "You don't have permission to access these submissions"
      );
    }

    const submissions = await TestSubmission.find({ testId }).populate({
      path: "studentId",
      select: "name email",
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          submissions,
          "Test submissions retrieved successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message ||
            "Something went wrong while retrieving test submissions"
        )
      );
  }
};

// Get a student's submission for a test
export const getStudentTestSubmission = async (req, res) => {
  try {
    const { testId, studentId } = req.params;
    const requesterId = req.id;

    // Need to fetch the user to check role
    const requester = await User.findById(requesterId).select("role");

    // Allow access only if the requester is the student or an instructor
    if (
      requesterId.toString() !== studentId &&
      requester.role !== "instructor"
    ) {
      throw new ApiError(
        403,
        "You don't have permission to access this submission"
      );
    }

    const submission = await TestSubmission.findOne({ testId, studentId })
      .populate({
        path: "testId",
        select: "lectureTitle questions testInstructions",
      })
      .populate({
        path: "studentId",
        select: "name email",
      });

    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          submission,
          "Test submission retrieved successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message ||
            "Something went wrong while retrieving the test submission"
        )
      );
  }
};

// Grade a submission (for instructors)
export const gradeTestSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { scores } = req.body;
    const instructorId = req.id;

    const submission = await TestSubmission.findById(submissionId);
    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    // Verify instructor permission
    const course = await Course.findById(submission.courseId);
    if (course.creator.toString() !== instructorId.toString()) {
      throw new ApiError(
        403,
        "You don't have permission to grade this submission"
      );
    }

    // Update scores
    let totalScore = 0;
    scores.forEach((scoreItem) => {
      const answerIndex = submission.answers.findIndex(
        (answer) => answer._id.toString() === scoreItem.answerId
      );

      if (answerIndex !== -1) {
        submission.answers[answerIndex].score = scoreItem.score;
        totalScore += scoreItem.score;
      }
    });

    submission.totalScore = totalScore;
    submission.status = "graded";
    await submission.save();

    return res
      .status(200)
      .json(new ApiResponse(200, submission, "Test graded successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message || "Something went wrong while grading the test"
        )
      );
  }
};

// Get all test submissions for the current student
export const getStudentAllSubmissions = async (req, res) => {
  try {
    const studentId = req.id;

    const submissions = await TestSubmission.find({ studentId })
      .populate({
        path: "testId",
        select: "lectureTitle questions testInstructions testDuration",
      })
      .populate({
        path: "courseId",
        select: "courseTitle courseLevel courseThumbnail category",
      })
      .sort({ submitTime: -1 }); // Sort by submission time, newest first

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          submissions,
          "Student test submissions retrieved successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message ||
            "Something went wrong while retrieving test submissions"
        )
      );
  }
};
