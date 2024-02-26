import express from 'express'
import myFacebook from '../controller/facebook-controller.js';
const router = express.Router();

router.get('/', myFacebook)

export default router;
