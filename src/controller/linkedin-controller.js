import Token from "../model/token.js";
import axios from "axios";
import { preparePostBody } from "../services/linkedin-service.js";

export async function loginWithLinkedin(req, res) {
  try {
    let url = "https://www.linkedin.com/oauth/v2/authorization";
    url += "?response_type=code";
    url += "&client_id=785do9buvvueo1";
    url += "&state=DCEeFWf45A53sdfKef424";
    url += "&scope=openid%20profile%20email%20w_member_social";
    url += `&redirect_uri=https://localhost:8000/linkedin/callback?id=${req?.user._id}`;

    res.status(200).json({ url });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
export async function linkedinCallback(req, res) {
  try {
    const { code, state, id } = req.query;
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const { data } = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        code,
        state,
        grant_type: "authorization_code",
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: `https://localhost:8000/linkedin/callback?id=${id}`,
      },
      { headers }
    );

    if (data) {
      const { scope, id_token, access_token, type, expires_in } = data;

      await Token.create({
        access_token,
        id_token,
        permission: scope,
        type,
        user: id,
        platform: "linkedin",
        expiry_date: new Date(Date.now() + expires_in * 1000),
      });
      console.log("🚀 ~ linkedinCallback ~  data.expires_in:");
    }

    const redirectUrl = `http://localhost:3000?success=true&platform=linkedin`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.log("🚀 ~ linkedinCallback ~ error:", error);
    res.status(403).json({ message: error.message });
  }
}

export async function makeLinkedinPost(req, res) {
  const { text, scheduledAt } = req.body;

  try {
    const token = await Token.findOne({
      user: req.user.id,
      platform: "linkedin",
    });

    const headers = {
      Authorization: `Bearer ${token.access_token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    };
    const body = await preparePostBody(headers, text);

    if (body) {
      await axios
        .post("https://api.linkedin.com/v2/ugcPosts", body, { headers })
        .then(() => res.status(200).json({ message: "posted" }));
    } else {
      res.status(400).json({ message: "no User Found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
