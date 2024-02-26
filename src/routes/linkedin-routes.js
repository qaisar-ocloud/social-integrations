import express from 'express'
import { makeLinkedinPost, linkedinCallback, loginWithLinkedin } from '../controller/linkedin-controller.js';
import authenticate from '../middleware/authMiddleware.js';
const router = express.Router();
router.get('/oauth', loginWithLinkedin)
router.get('/callback', linkedinCallback);
router.post('/make-post', authenticate, makeLinkedinPost)

export default router;