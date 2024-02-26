import express from 'express'
import { makeLinkedinPost, linkedinCallback, loginWithLinkedin } from '../controller/linkedin-controller.js';

const router = express.Router();
router.get('/oauth', loginWithLinkedin)
router.get('/callback', linkedinCallback);
router.post('/make-post', makeLinkedinPost)

export default router;