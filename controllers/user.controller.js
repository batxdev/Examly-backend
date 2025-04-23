import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};
export const logout = async (_, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("enrolledCourses");
    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { name, photoUrl } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    // extract public id of the old image from the url is it exists;
    if (user.photoUrl) {
      const publicId = user.photoUrl.split("/").pop().split(".")[0]; // extract public id
      deleteMediaFromCloudinary(publicId);
    }

    const updatedData = { name };

    // Only update photoUrl if provided
    if (photoUrl) {
      updatedData.photoUrl = photoUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Add this to user.controller.js

export const getUserAttendance = async (req, res) => {
  try {
    const userId = req.id;
    const { date } = req.query;

    // This is where you would actually fetch real attendance data from your database
    // For this example, we're returning mock data

    // Calculate the month from the date parameter
    const targetDate = date ? new Date(date) : new Date();
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();

    // Generate some mock attendance data
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const attendanceDays = [];
    const absentDays = [];

    // Simulate some present/absent days
    for (let i = 1; i <= daysInMonth; i++) {
      // Skip weekends (Saturday and Sunday)
      const currentDate = new Date(year, month, i);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Weekday
        if (Math.random() > 0.2) {
          // 80% chance of attendance
          attendanceDays.push(
            `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(
              2,
              "0"
            )}`
          );
        } else {
          absentDays.push(
            `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(
              2,
              "0"
            )}`
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Attendance fetched successfully",
      data: {
        present: attendanceDays.length,
        absent: absentDays.length,
        total: attendanceDays.length + absentDays.length,
        daysPresent: attendanceDays,
        daysAbsent: absentDays,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance data",
    });
  }
};
