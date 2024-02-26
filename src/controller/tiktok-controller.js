import tiktokService from '../services/tiktok-service.js';


export function myTiktok(req, res) {
    return tiktokService.getMyTiktok(
    )
}
export async function getMyTiktokOAuth(req, res) {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });
    let url = 'https://www.tiktok.com/v2/auth/authorize/';

    url += `?client_key=awxx5cv1ozcqwa90`;
    url += '&scope=user.info.basic';
    url += '&response_type=code';
    url += '&redirect_uri=https://ocloudsolutions.net';
    url += '&state=' + csrfState;

    res.redirect(url);
}
