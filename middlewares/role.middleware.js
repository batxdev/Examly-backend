import { User } from "../models/user.model.js";

export const isInstructor = async (req, res, next) => {
  try {
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only instructors can perform this action.",
      });
    }

    next();
  } catch (error) {
    console.error("Role check error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking user role",
    });
  }
};
