import axios from "axios";
import crypto from 'crypto'

export function prepareRequesData(access_token, gqlQueryParams) {
    const app_secret = '65d19d92fbc7a7fb08e93caf2e91313b'
    const appsecret_proof = crypto.createHmac('sha256', app_secret)
        .update(access_token)
        .digest('hex');

    const requestData = {
        access_token: access_token,
        appsecret_proof: appsecret_proof,

        batch: JSON.stringify([
            { method: 'GET', relative_url: `${gqlQueryParams}` },
        ])
    };

    return requestData
}

export async function makeFacebookGraphqlReq(requestData) {

    const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com/';

    return axios.post(FACEBOOK_GRAPH_API_BASE_URL, requestData)
        .then(({ data }) => {
            const temp = JSON.parse(data[0]?.body)
            return temp
        })
        .catch(error => {
            console.error('Error making the request:', error);
            throw error
        });

}

export async function validateFacebookToken(access_token) {
    const currentUserToken = access_token;
    const validAppAccessToken = process.env.FACEBOOK_APP_ACCESS_TOKEN || '693823482937293|2HnmlrY3hT3eNVmZFAR8o5-ejjo';

    let BASE_URL = 'https://graph.facebook.com/debug_token'
    BASE_URL += `?input_token=${currentUserToken}`
    BASE_URL += `&access_token=${validAppAccessToken}`

    return axios.get(BASE_URL)
        .then(response => {
            return response.data
        })
        .catch(error => {
            console.error('Error:', error.message);
            throw error
        });

}


