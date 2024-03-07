import express from "express";
const router = express.Router();
import authenticate from "../middleware/authMiddleware.js";
import { createSocialPostWIthMany } from "../controller/post-controller.js";

router.post("/make-with-may", authenticate, createSocialPostWIthMany);

export default router;
