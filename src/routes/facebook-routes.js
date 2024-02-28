import express from 'express'
import { getMyFacebookToken, catchFacebookRedirect } from '../controller/facebook-controller.js';
import axios from 'axios';
const router = express.Router();

router.get('/oauth', getMyFacebookToken)


router.get('/callback', catchFacebookRedirect)


export default router;
