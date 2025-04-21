import { Router } from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  startTest,
  submitTest,
  getTestSubmissions,
  getStudentTestSubmission,
  gradeTestSubmission,
  getStudentAllSubmissions,
} from "../controllers/testSubmission.controller.js";
import { isInstructor } from "../middlewares/role.middleware.js";

const router = Router();

// Protected routes (require authentication)
router.use(isAuthenticated);

// Student routes
router.post("/start", startTest);
router.post("/submit", submitTest);
router.get("/my-submissions", getStudentAllSubmissions);
router.get("/:testId/student/:studentId", getStudentTestSubmission);

// Instructor routes (require instructor role)
router.use(isInstructor);
router.get("/:testId/submissions", getTestSubmissions);
router.patch("/submissions/:submissionId/grade", gradeTestSubmission);

export default router;
