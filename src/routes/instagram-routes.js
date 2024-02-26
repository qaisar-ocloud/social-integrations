import express from 'express'
import myInstagram from '../controller/instagram-controller.js';
const router = express.Router();

router.get('/', myInstagram)

export default router;
