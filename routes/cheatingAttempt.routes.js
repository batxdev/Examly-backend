import express from "express";
import {
  logCheatingAttempt,
  getAllCheatingAttempts,
} from "../controllers/cheatingAttempt.controller.js";

const router = express.Router();

router.post("/cheating-attempt", logCheatingAttempt);
router.get("/cheating-attempts", getAllCheatingAttempts);

export default router;
