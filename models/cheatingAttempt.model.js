import mongoose from "mongoose";

const cheatingAttemptSchema = new mongoose.Schema({
  studentEmail: {
    type: String,
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  warnings: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("CheatingAttempt", cheatingAttemptSchema);
