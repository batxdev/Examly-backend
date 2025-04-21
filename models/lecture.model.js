import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  answerType: {
    type: String,
    enum: ["text", "multipleChoice", "singleChoice"],
    default: "text",
  },
  options: [String],
  correctAnswer: String, // For graded questions (optional)
});

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: true,
    },
    videoUrl: { type: String },
    publicId: { type: String },
    isPreviewFree: { type: Boolean },
    // New fields for test functionality
    isTest: { type: Boolean, default: false },
    questions: [questionSchema],
    testDuration: { type: Number }, // in minutes
    testInstructions: { type: String },
  },
  { timestamps: true }
);

export const Lecture = mongoose.model("Lecture", lectureSchema);
