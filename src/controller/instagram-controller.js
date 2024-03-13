import axios from "axios";
import Token from "../model/token.js";

export async function loginWithInstagram(req, res) {
  try {
    let url = "https://api.instagram.com/oauth/authorize";
    url += "?response_type=code";
    url += "&client_id=946306300455877";
    url += `&state=${req?.user.id}`;
    url += "&scope=user_profile,user_media";
    url += "&redirect_uri=https://localhost:8000/instagram/callback";
    res.status(200).json({ url });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function instagramCallback(req, res) {
  const { code, state } = req.query;
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  try {
    return await axios
      .post(
        "https://api.instagram.com/oauth/access_token",
        {
          code,
          state,
          grant_type: "authorization_code",
          client_id: process.env.INSTAGRAM_APP_ID,
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          redirect_uri: "https://localhost:8000/instagram/callback",
        },
        { headers }
      )
      .then(({ data }) => {
        let url = "https://graph.instagram.com/access_token";
        url += "?grant_type=ig_exchange_token";
        url += `&client_secret=${process.env.INSTAGRAM_APP_SECRET}`;
        url += `&access_token=${data?.access_token}`;

        return saveLongTermAccessToken(url, data, state);
      })
      .then((response) => {
        if (response?.success) {
          const redirectUrl = `http://localhost:3000?success=true&platform=instagram`;
          return res.redirect(redirectUrl);
        }
        return res.status(400).json({ message: "Instagram Server Error" });
      });
  } catch (error) {
    console.log("🚀 ~ instagramCallback ~ error:", error);
    res.status(403).json({ message: error.message });
  }
}

export async function getRefreshAccessToken(req, res) {
  const token = await Token.findOne({
    // user:req.user.id,
    platform: "instagram",
  });
  if (token) {
    let url = " https://graph.instagram.com/refresh_access_token";
    url += "?grant_type=ig_refresh_token";
    url += `&access_token=${token?.access_token}`;

    return await axios
      .get(url)
      .then((data) => saveLongTermAccessToken(url, data, req?.user._id))
      .catch((error) => res.status(400).json({ message: error.message }));
  }
}

export async function makeInstagramPost(req, res) {
  console.log("🚀 ~ makeInstagramPost ~ req:", req.user._id);
  const { text: caption, link: imagePath } = req.body;

  const token = await Token.findOne({
    user: req?.user._id,
    platform: "instagram",
  });
  // console.log("🚀 ~ makeInstagramPost ~ token:", token);
  // const test = await axios.get(
  //   `https://graph.facebook.com/v19.0/me/adaccounts?access_token=${token?.access_token}`
  // );
  // console.log("🚀 ~ makeInstagramPost ~ test:", test);
  if (token) {
    const { platform_user_id: user_id } = token;
    let BASE_URL = "https://graph.facebook.com/v19.0";
    BASE_URL += `/${user_id}`;

    let containerizedImageUrl = BASE_URL;
    containerizedImageUrl += "/media";
    containerizedImageUrl += `?image_url=${imagePath}`;
    containerizedImageUrl += `&caption=${caption}`;

    console.log(
      "🚀 ~ makeInstagramPost ~ containerizedImageUrl:",
      containerizedImageUrl
    );
    return (
      axios
        .post(containerizedImageUrl)
        .then(({ id }) => {
          console.log("🚀 ~ .then ~ id:", id);
          let publishImageUrl = BASE_URL;
          publishImageUrl += `media_publish/`;
          publishImageUrl += `?creation_id=${id}`;
          // return axios.post(publishImageUrl);
        })
        // .then((id) => id)
        .catch((error) => {
          res.status(400).json({ message: error.response.data });
        })
    );
  }
}

async function saveLongTermAccessToken(url, shortToken, userId) {
  try {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const { data } = await axios.get(url, { headers });
    if (data) {
      const { access_token, token_type, expires_in } = data;
      await Token.create({
        access_token,
        token_type,
        user: userId,
        platform_user_id: shortToken?.user_id,
        permission: ["instagram_graph_user_profile"],
        platform: "instagram",
        expiry_date: new Date(Date.now() + expires_in * 1000),
      });
      if (access_token.length) {
        return { success: true };
      }
    }
    return { success: false };
  } catch (error) {
    console.log("🚀 ~ saveLongTermAccessToken ~ error:", error);
    throw new Error(error);
  }
}
