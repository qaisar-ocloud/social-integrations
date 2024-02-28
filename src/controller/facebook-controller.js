import getMyFacebook from '../services/facebook-service.js';
import axios from 'axios';

export async function getMyFacebookToken(req, res) {

    try {
        const REDIRECT_URI = 'https://localhost:8000/facebook/callback'
        const APP_ID = '693823482937293'
        const url = `https://www.facebook.com/v13.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=email`;
        res.redirect(url);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function makeMyFacebookPost(req, res) {

    const { access_token, message } = req.body;
    try {

        const postResponse = await axios.post(`${FACEBOOK_GRAPH_API_BASE_URL} /me/feed`, {
            message,
        }, {
            params: {
                access_token,
            },
        });

        res.json({ postId: postResponse.data.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }


}
export async function catchFacebookRedirect(req, res) {
    const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com';
    const REDIRECT_URI = 'https://localhost:8000/facebook/callback'
    const { code } = req.query;
    try {

        const { data } = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/v13.0/oauth/access_token`, {
            params: {
                client_id: process.env.FACEBOOK_APP_ID || '693823482937293',
                client_secret: process.env.FACEBOOK_APP_SECRET || '65d19d92fbc7a7fb08e93caf2e91313b',
                redirect_uri: `${REDIRECT_URI}`,
                code,
            },
        });

        console.log("🚀 ~ router.get ~ data:", data)
        res.send('working')
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}