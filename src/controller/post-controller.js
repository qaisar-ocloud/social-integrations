import axios from "axios";
import dayjs from "dayjs";
import Token from "../model/token.js";
import Post from "../model/post.js";
import { preparePostBody as preparePostBodyForLinkedIn } from "../services/linkedin-service.js";
import {
  makeFacebookGraphqlReq,
  prepareQueryForFbGraphql,
  prepareMutationForFbGraphql,
} from "../services/facebook-service.js";

export async function createSocialPostWIthMany(req, res) {
  const { platforms, text, published, scheduledAfter: scheduled_at } = req.body;
  const { user } = req;

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
      ? postToLinkedIn(linkedInToken, text, scheduled_at, user._id)
      : null;
    const facebookPromise = facebookToken
      ? postToFacebook(facebookToken, text, published, scheduled_at, user._id)
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

async function postToLinkedIn(accessToken, text, scheduled_at, user_id) {
  try {
    if (scheduled_at > 0) {
      const scheduledPost = await Post.create({
        text,
        is_scheduled: true,
        scheduled_at: dayjs.unix(scheduled_at),
        user: user_id,
        token: accessToken,
        platform: "linkedin",
      });

      return {
        message: `Post is scheduled at ${dayjs().unix(scheduled_at)}`,
        caption: scheduledPost?.text,
      };
    }

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

    return data?.id
      ? { message: "Posts created successfully", data }
      : new Error("linkedin server error", data);
  } catch (error) {
    console.error("Error posting to LinkedIn:", error);
    throw error;
  }
}

async function postToFacebook(
  accessToken,
  text,
  published,
  scheduled_at,
  user_id
) {
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

        const batchBody = scheduled_at
          ? {
              message: text,
              scheduled_publish_time: scheduled_at,
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
        if (postResponse?.id) {
          const response = scheduled_at
            ? {
                message: `Post Scheduled to be Published at ${dayjs(
                  scheduled_at
                ).unix()}`,
                postResponse,
              }
            : {
                message: `Post Pulished`,
                postResponse,
              };
          return response;
        } else throw new Error("facebook Server Error", postResponse);
      })
      .catch((error) => {
        error: error.message;
      });
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    throw error;
  }
}
