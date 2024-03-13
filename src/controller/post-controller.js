import axios from "axios";
import Token from "../model/token.js";

import { fileUpload } from "../utills/services/upload-media.js";
import { postToFacebook } from "../services/facebook-service.js";
import { postToLinkedIn } from "../services/linkedin-service.js";
import { postToInstagram } from "../services/instagram-service.js";
export async function createSocialPostWIthMany(req, res) {
  const { platforms, text, published, scheduledAfter: scheduled_at } = req.body;
  const file = !req.file ? null : req.file;
  const image_url = file ? await fileUpload(file.path) : null;

  try {
    const tokenPromises = platforms
      .split(",")
      ?.map((item) => Token.findOne({ platform: item }));

    const tokens = await Promise.all(tokenPromises);

    const linkedInToken = tokens.find(
      (token) => token?.platform === "linkedin"
    )?.access_token;

    const facebookToken = tokens.find(
      (token) => token?.platform === "facebook"
    );

    const instagramToken = tokens.find(
      (token) => token?.platform === "instagram"
    );

    const linkedInPromise = linkedInToken
      ? postToLinkedIn(
          linkedInToken,
          text,
          scheduled_at,
          req?.user._id,
          image_url?.secure_url
        )
      : null;

    const facebookPromise = facebookToken
      ? postToFacebook(
          facebookToken,
          text,
          published,
          scheduled_at,
          image_url?.secure_url
        )
      : null;

    // const instagramPromise = instagramToken
    //   ? postToInstagram(instagramToken, text, scheduled_at, image_url)
    //   : null;

    const [
      linkedInResponse,
      facebookResponse,
      //   // instagramResponse
    ] = await Promise.all([
      linkedInPromise,
      facebookPromise,
      // instagramPromise
    ]);

    return res.status(200).json({
      linkedInResponse,
      facebookResponse,
      // instagramResponse,
    });
  } catch (error) {
    console.error("Error in createSocialPostWIthMany:", error);
    return res.status(500).json({ error: error?.message });
  }
}
