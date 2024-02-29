import express from 'express'
import {
    getMyFacebookToken,
    makeMyFacebookPost,
    catchFacebookRedirect
} from '../controller/facebook-controller.js';

const router = express.Router();

router.get('/oauth', getMyFacebookToken)
router.get('/callback', catchFacebookRedirect)
router.post('/make-post', makeMyFacebookPost)

export default router;
