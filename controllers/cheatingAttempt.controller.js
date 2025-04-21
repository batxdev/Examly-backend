import CheatingAttempt from "../models/cheatingAttempt.model.js";

export const logCheatingAttempt = async (req, res) => {
  try {
    console.log("Received cheating attempt request:", req.body);
    const { studentEmail, testId } = req.body;

    // Validate required fields
    if (!studentEmail || !testId) {
      console.error("Missing required fields:", { studentEmail, testId });
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: studentEmail and testId are required",
      });
    }

    console.log("Creating new cheating attempt record with:", {
      studentEmail,
      testId,
    });

    const cheatingAttempt = new CheatingAttempt({
      studentEmail,
      testId,
      warnings: 3, // Maximum warnings reached
    });

    const savedAttempt = await cheatingAttempt.save();
    console.log("Cheating attempt saved successfully:", savedAttempt);

    res.status(200).json({
      success: true,
      message: "Cheating attempt logged successfully",
      data: savedAttempt,
    });
  } catch (error) {
    console.error("Error logging cheating attempt:", error);
    res.status(500).json({
      success: false,
      message: "Error logging cheating attempt",
      error: error.message,
    });
  }
};

// Add a new method to get all cheating attempts
export const getAllCheatingAttempts = async (req, res) => {
  try {
    const attempts = await CheatingAttempt.find().sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    console.error("Error fetching cheating attempts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cheating attempts",
      error: error.message,
    });
  }
};
