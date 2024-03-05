import axios from 'axios';
import getMyInstagram from '../services/instagram-service.js';

export async function loginWithInstagram(req, res) {
    try {
        let url = 'https://api.instagram.com/oauth/authorize'
        url += '?response_type=code'
        url += '&client_id=946306300455877'
        url += '&state=DCEeFWf45A53sdfKef424'
        url += '&scope=user_profile,user_media'
        url += '&redirect_uri=https://localhost:8000/instagram/callback'
        res.status(200).json({ url })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export async function instagramCallback(req, res) {

    const { code, state } = req.query;

    try {
        await axios.post('https://api.instagram.com/oauth/access_token',
            {
                code,
                state,
                grant_type: "authorization_code",
                client_id: process.env.INSTAGRAM_APP_ID || '946306300455877',
                client_secret: process.env.INSTAGRAM_APP_SECRET || '41761930127b522eb5e82ca0fd04ccae',
                redirect_uri: "http://localhost:8000/instagram/callback",

            }).then((data) => {
                const url = 'https://graph.instagram.com/access_token'
                ur += '?grant_type=ig_exchange_token'
                url += `&client_secret=${process.env.INSTAGRAM_APP_SECRET || '41761930127b522eb5e82ca0fd04ccae'}`
                url += `&access_token=${data.access_token}`

                return saveLongTermAccessToken(data)
            })

    } catch (error) {
        res.status(403).json({ message: error.message })
    }

}

export async function getRefreshAccessToken(req, res) {
    const token = await Token.findOne({
        // user:req.user.id,
        platform: 'instagram'
    })
    if (token) {

        const url = ' https://graph.instagram.com/refresh_access_token'
        url += '?grant_type=ig_refresh_token'
        url += `&access_token=${token?.access_token}`

        return await axios.get(url)
            .then((data) => saveLongTermAccessToken(url, data))
            .catch(error => res.status(400).json({ message: error.message }))

    }

}

export async function makeInstagramPost(req, res) {
    const { body: { text: caption } } = req
    const token = await Token.findOne({
        // user:req.user.id,
        platform: 'instagram'
    })
    const { user_id } = token
    let BASE_URL = 'https://graph.facebook.com/v19.0'
    BASE_URL += `/${user_id}`

    if (token) {
        let containerizedImageUrl = BASE_URL
        containerizedImageUrl += '/media';
        containerizedImageUrl += `?image_url=${imagePath}`;
        containerizedImageUrl += `&caption=${caption}`;

        return axios.post(BASE_URL)
            .then(({ id }) => {
                let publishImageUrl = BASE_URL
                publishImageUrl += `media_publish/`
                publishImageUrl += `?creation_id=${id}`
                return axios.post(publishImageUrl)
            })
            .then((id) => id)
            .catch(err => res.status(400).json({ message: err.message }))

    }
    res.status(400).json({ message: err.message })
}


async function saveLongTermAccessToken(data, url) {
    try {
        const response = axios.get(url)
        if (response) {
            const currentTime = Date.now()
            const { access_token, token_type, expires_in } = data

            await Token.create({
                access_token,
                token_type,
                platform_user_id: data.user_id,
                permision: ['instagram_graph_user_profile'],
                platform: 'instagram',
                expiry_date: new Date(currentTime + expires_in),
            })
        }
        res.status(200).json({ message: 'Token Created Successfully' })
    } catch (error) {
        res.status(403).json({ message: error.message })
    }
}