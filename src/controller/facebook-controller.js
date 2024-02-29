import {
    makeFacebookGraphqlReq,
    prepareRequesData,
    validateFacebookToken
} from '../services/facebook-service.js';
import axios from 'axios';
import Token from '../model/token.js'

export async function getMyFacebookToken(req, res) {

    try {
        let BASE_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
        const APP_ID = process.env.FACEBOOK_APP_ID || '693823482937293'
        const REDIRECT_URI = 'https://localhost:8000/facebook/callback'

        BASE_URL += `?client_id=${APP_ID}`
        BASE_URL += `&redirect_uri=${REDIRECT_URI}`
        BASE_URL += `&scope=email`

        res.redirect(BASE_URL);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function catchFacebookRedirect(req, res) {
    const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com';
    const REDIRECT_URI = 'https://localhost:8000/facebook/callback'
    const { code } = req.query;

    try {
        const { data } = await axios.get(`${FACEBOOK_GRAPH_API_BASE_URL}/v19.0/oauth/access_token`, {
            params: {
                client_id: process.env.FACEBOOK_APP_ID || '693823482937293',
                client_secret: process.env.FACEBOOK_APP_SECRET || '65d19d92fbc7a7fb08e93caf2e91313b',
                redirect_uri: `${REDIRECT_URI}`,
                code,
            },
        });

        const { access_token, token_type } = data
        const { data: temp } = await validateFacebookToken(access_token)

        const { data_access_expires_at, issued_at, scopes: permission, user_id: fbUserID } = temp
        const currentTime = Date.now()

        await Token.create({
            access_token: access_token,
            type: token_type,
            user: req.user?.id ?? '65dc6a3c28d9caf406e85e86',
            platform: 'facebook',
            permission,
            platform_user_id: fbUserID,
            expiry_date: new Date(currentTime + (data_access_expires_at - issued_at)),
        })

        res.send('Access token Created Successfully')
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}

export async function makeMyFacebookPost(req, res) {
    const { text } = req.body;

    return Token.findOne({
        platform: 'facebook'
    })
        .then((token) => {
            const { access_token, platform_user_id: userId } = token
            const gqlQueryParams = `${userId}/accounts`
            const requestData = prepareRequesData(access_token, gqlQueryParams)
            const fbPostObj = {
                "message": text,
                "link": "https://media.kasperskycontenthub.com/wp-content/uploads/sites/103/2019/09/26105755/fish-1.jpg",
                "published": "true",
            }

            return makeFacebookGraphqlReq(requestData)
        })
        .then((pagesInfo) => {
            console.log("🚀 ~ .then ~ pagesInfo:", pagesInfo.data[0])
            const { access_token, id } = pagesInfo.data[0]
            const item = `${id}/feed`
            let temp = prepareRequesData(access_token, item)

            temp.message = text;
            temp.published = true
            temp.link = "https://media.kasperskycontenthub.com/wp-content/uploads/sites/103/2019/09/26105755/fish-1.jpg";

            return makeFacebookGraphqlReq(temp)
        }).then((test) => res.status(200).json({ test }))
        .catch((error) => {
            console.log("🚀 ~ makeMyFacebookPost ~ error:", error)

            res.status(500).json({ error: error });
        })

}


