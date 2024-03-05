import express from "express";
import {
  loginWithInstagram,
  getRefreshAccessToken,
  instagramCallback,
  makeInstagramPost,
} from "../controller/instagram-controller.js";
import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/oauth", loginWithInstagram);
router.get("callback", instagramCallback);
router.get("refresh-access-token", getRefreshAccessToken);
router.post("make-post", authenticate, makeInstagramPost);

export default router;
