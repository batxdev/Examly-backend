import express from "express";
import { uploadMedia } from "../utils/cloudinary.js";

const router = express.Router();

router.route("/upload-video").post(async (req, res) => {
  try {
    const result = await uploadMedia(req.body.fileUrl);
    res.status(200).json({
      success: true,
      message: "File uploaded successfully.",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error uploading file" });
  }
});
export default router;
