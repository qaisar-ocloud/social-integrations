import express from "express";
const router = express.Router();
import authenticate from "../middleware/authMiddleware.js";
import multerUpload from "../middleware/multer.js";
import { createSocialPostWIthMany } from "../controller/post-controller.js";

router.post(
  "/make-with-may",
  authenticate,
  multerUpload.single("file"),
  createSocialPostWIthMany
);

export default router;
