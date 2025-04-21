import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questionText: {
    type: String,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be String, Number, or Array for multiple choice
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
});

const testSubmissionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    submitTime: {
      type: Date,
    },
    answers: [answerSchema],
    totalScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["started", "submitted", "graded"],
      default: "started",
    },
  },
  { timestamps: true }
);

export const TestSubmission = mongoose.model(
  "TestSubmission",
  testSubmissionSchema
);
