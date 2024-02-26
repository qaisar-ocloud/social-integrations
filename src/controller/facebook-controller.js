import getMyFacebook from '../services/facebook-service.js';

export default function myFacebook(req, res) {
    return getMyFacebook()
}