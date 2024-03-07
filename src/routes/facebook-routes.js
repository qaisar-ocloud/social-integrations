import express from "express";
import {
  getMyFacebookToken,
  makeMyFacebookPost,
  catchFacebookRedirect,
} from "../controller/facebook-controller.js";
import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/oauth", authenticate, getMyFacebookToken);
router.get("/callback", catchFacebookRedirect);
router.post("/make-post", authenticate, makeMyFacebookPost);

export default router;
