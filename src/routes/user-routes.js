import express from "express";

const router = express.Router();
import authenticate from "../middleware/authMiddleware.js";

import { registerUser, loginUser } from "../controller/user-controller.js";

router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
