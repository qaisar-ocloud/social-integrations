import axios from "axios";
import Token from "../model/token.js";
import { preparePostBody as preparePostBodyForLinkedIn } from "../services/linkedin-service.js";
import {
  makeFacebookGraphqlReq,
  prepareQueryForFbGraphql,
  prepareMutationForFbGraphql,
} from "../services/facebook-service.js";

export async function createSocialPostWIthMany(req, res) {
  const { platforms, text, published, scheduledAfter } = req.body;

  try {
    const tokenPromises = platforms.map((item) =>
      Token.findOne({ platform: item })
    );

    const tokens = await Promise.all(tokenPromises);

    const linkedInToken = tokens.find(
      (token) => token?.platform === "linkedin"
    )?.access_token;

    const facebookToken = tokens.find(
      (token) => token?.platform === "facebook"
    );

    const linkedInPromise = linkedInToken
      ? postToLinkedIn(linkedInToken, text)
      : null;
    const facebookPromise = facebookToken
      ? postToFacebook(facebookToken, text, published, scheduledAfter)
      : null;

    const [linkedInResponse, facebookResponse] = await Promise.all([
      linkedInPromise,
      facebookPromise,
    ]);

    return res.status(200).json({
      linkedInResponse,
      facebookResponse,
    });
  } catch (error) {
    console.error("Error in createSocialPostWIthMany:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function postToLinkedIn(accessToken, text) {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    };

    const body = await preparePostBodyForLinkedIn(headers, text);

    const { data } = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      body,
      {
        headers,
      }
    );

    return { message: "Posts created successfully", data };
  } catch (error) {
    console.error("Error posting to LinkedIn:", error);
    throw error;
  }
}

async function postToFacebook(accessToken, text, published, scheduledAfter) {
  try {
    const { access_token, platform_user_id: userId } = accessToken;
    const gqlQueryParams = `${userId}/accounts`;
    const accessProofForPages = prepareQueryForFbGraphql(
      access_token,
      gqlQueryParams
    );
    return makeFacebookGraphqlReq(accessProofForPages)
      .then((pagesInfo) => {
        const { access_token, id } = pagesInfo;
        const item = `${id}/feed`;

        const scheduledAt = Math.floor(Date.now() / 1000) + scheduledAfter;
        const batchBody = scheduledAfter
          ? {
              message: text,
              scheduled_publish_time: scheduledAt,
              published,
            }
          : {
              message: text,
              published,
            };

        let accessProofForPost = prepareMutationForFbGraphql(
          access_token,
          item,
          batchBody
        );
        return makeFacebookGraphqlReq(accessProofForPost);
      })
      .then((postResponse) => {
        return scheduledAfter
          ? {
              message: `Post Scheduled to Publish after ${scheduledAfter} seconds`,
              postResponse,
            }
          : {
              message: `Post Pulished`,
              postResponse,
            };
      })
      .catch((error) => {
        error: error.message;
      });
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    throw error;
  }
}
