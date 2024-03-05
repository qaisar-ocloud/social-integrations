import axios from "axios";
import crypto from "crypto";

export function prepareQueryForFbGraphql(access_token, gqlQueryParams) {
  try {
    if (!access_token || !gqlQueryParams) {
      throw new Error(
        "Access token and GraphQL query parameters are required."
      );
    }

    const app_secret = "65d19d92fbc7a7fb08e93caf2e91313b";
    const appsecret_proof = crypto
      .createHmac("sha256", app_secret)
      .update(access_token)
      .digest("hex");

    const requestData = {
      access_token: access_token,
      appsecret_proof: appsecret_proof,
      batch: JSON.stringify([
        { method: "GET", relative_url: `${gqlQueryParams}` },
      ]),
    };

    return requestData;
  } catch (error) {
    console.error("Error preparing Facebook GraphQL query:", error.message);
    throw error;
  }
}

export function prepareMutationForFbGraphql(
  access_token,
  gqlQueryParams,
  batchBody
) {
  try {
    if (!access_token || !gqlQueryParams || !batchBody) {
      throw new Error(
        "Access token, GraphQL query parameters, and batch body are required."
      );
    }

    const app_secret = "65d19d92fbc7a7fb08e93caf2e91313b";
    const appsecret_proof = crypto
      .createHmac("sha256", app_secret)
      .update(access_token)
      .digest("hex");

    const requestData = {
      access_token: access_token,
      appsecret_proof: appsecret_proof,
      batch: JSON.stringify([
        {
          method: "POST",
          relative_url: gqlQueryParams,
          body: Object.keys(batchBody)
            .map((key) => `${key}=${encodeURIComponent(batchBody[key])}`)
            .join("&"),
        },
      ]),
    };

    return requestData;
  } catch (error) {
    console.error("Error preparing Facebook GraphQL mutation:", error.message);
    throw error;
  }
}

export async function makeFacebookGraphqlReq(requestData) {
  try {
    if (!requestData) {
      throw new Error("Request data is required.");
    }

    const FACEBOOK_GRAPH_API_BASE_URL = "https://graph.facebook.com/";

    const { data } = await axios.post(FACEBOOK_GRAPH_API_BASE_URL, requestData);

    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid response data format.");
    }

    const post = JSON.parse(data[0]?.body);
    if (!post) {
      throw new Error("Invalid response body format.");
    }

    return post.data ? post.data[0] : post;
  } catch (error) {
    console.error("Error making Facebook GraphQL request:", error);
    throw error;
  }
}

export async function validateFacebookToken(access_token) {
  try {
    if (!access_token) {
      throw new Error("Access token is required.");
    }

    const currentUserToken = access_token;
    const validAppAccessToken =
      process.env.FACEBOOK_APP_ACCESS_TOKEN ||
      "693823482937293|2HnmlrY3hT3eNVmZFAR8o5-ejjo";

    let BASE_URL = "https://graph.facebook.com/debug_token";
    BASE_URL += `?input_token=${currentUserToken}`;
    BASE_URL += `&access_token=${validAppAccessToken}`;

    const response = await axios.get(BASE_URL);
    const data = response.data;

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response data format.");
    }

    return data;
  } catch (error) {
    console.error("Error validating Facebook token:", error.message);
    throw error;
  }
}

export async function createSocialPostWIthMany(req, res) {
  const { platforms, text, link, published, scheduledAfter } = req.body;

  return Promise.all(
    platforms.map((item) =>
      Token.findOne({
        platform: item,
      })
    )
  )
    .then((tokens) => {
      for (const token of tokens) {
        if (token.platform === "facebook") {
          const { access_token, platform_user_id: userId } = token;
          const gqlQueryParams = `${userId}/accounts`;
          const accessProofForPages = prepareQueryForFbGraphql(
            access_token,
            gqlQueryParams
          );

          return makeFacebookGraphqlReq(accessProofForPages);
        }
      }
    })
    .then((pagesInfo) => {
      const { access_token, id } = pagesInfo;
      const item = `${id}/feed`;

      const scheduledAt = Math.floor(Date.now() / 1000) + scheduledAfter;
      const batchBody = scheduledAfter
        ? {
            message: text,
            link,
            scheduled_publish_time: scheduledAt,
            published,
          }
        : {
            message: text,
            link,
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
        ? res.status(200).json({
            message: `Post Scheduled to Publish after ${scheduledAfter} seconds`,
            postResponse,
          })
        : res.status(200).json({
            message: `Post Pulished`,
            postResponse,
          });
    })
    .catch((error) => res.status(500).json({ error: error.message }));
}
