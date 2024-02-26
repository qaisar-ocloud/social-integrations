import getMyLinkedIn from '../services/linkedin-service.js';
import Token from '../model/token.js';
import axios from 'axios';

export async function loginWithLinkedin(req, res) {
    try {
        let url = 'https://www.linkedin.com/oauth/v2/authorization'
        url += '?response_type=code'
        url += '&client_id=785do9buvvueo1'
        url += '&state=DCEeFWf45A53sdfKef424'
        url += '&scope=openid%20profile%20email%20w_member_social'
        url += '&redirect_uri=http://localhost:8000/linkedin/callback'
        res.redirect(url)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
export async function linkedinCallback(req, res) {

    const { code, state } = req.query;
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    try {
        const { data } = await axios.post('https://www.linkedin.com/oauth/v2/accessToken',
            {
                code,
                state,
                grant_type: "authorization_code",
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                redirect_uri: "http://localhost:8000/linkedin/callback",
            }, { headers })

        if (data) {
            const currentTime = Date.now()
            const { scope, id_token, access_token, type } = data
            await Token.create({
                access_token,
                id_token,
                scope,
                type,
                user: req.user?.id ?? '65dc6a3c28d9caf406e85e86',
                platform: 'linkedin',
                expiry_date: new Date(currentTime + data.expires_in),
            })
        }
        res.status(200).json({ message: 'Token Created Successfully' })
    } catch (error) {
        res.status(403).json({ message: error.message })
    }

}

export async function makeLinkedinPost(req, res) {
    const { text } = req.body
    try {
        const token = await Token.findOne()
        const headers = {
            'Authorization': `Bearer ${token.access_token}`,
            'X-Restli-Protocol-Version': '2.0.0'
        };
        const { data } = await axios.get('https://api.linkedin.com/v2/userinfo', { headers, })

        const body = {
            "author": `urn:li:person:${data.sub}`,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        text
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        await axios.post('https://api.linkedin.com/v2/ugcPosts', body, { headers }).then(() =>
            res.status(200).json({ message: 'posted' })
        )
    } catch (error) {
        res.status(400).json({ message: error.message })

    }
}

