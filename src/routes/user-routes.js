import express from 'express';

const router = express.Router();
import { protect } from "../middleware/authMiddleware.js";

import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controller/user-controller.js";

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot", forgotPassword);
router.post("/resetPassword/:id", resetPassword);
router.get("/getme", protect, getMe);

export default router;
