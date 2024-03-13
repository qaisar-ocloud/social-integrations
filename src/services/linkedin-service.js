import axios from "axios";
import dayjs from "dayjs";
import FormData from "form-data";
import Post from "../model/post.js";
import fs from "fs";
const fetchUserLinkedinProfile = async (headers) => {
  try {
    const { data } = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers,
    });
    console.log("🚀 ~ fetchUserLinkedinProfile ~ data:", data);
    return data;
  } catch (error) {
    throw new Error("Error fetching LinkedIn profile:", error);
  }
};

export const preparePostBody = async (
  headers,
  text,
  mediaUrl = null,
  mediaAsset = null
) => {
  try {
    const data = await fetchUserLinkedinProfile(headers);
    return {
      author: `urn:li:person:${data.sub}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": mediaUrl
          ? {
              shareCommentary: {
                text,
              },
              shareMediaCategory: "IMAGE",
              media: [
                {
                  status: "READY",
                  description: {
                    text: "Center stage!",
                  },
                  media: mediaAsset,
                  title: {
                    text: "LinkedIn Talent Connect 2021",
                  },
                },
              ],
            }
          : {
              shareCommentary: {
                text,
              },
              shareMediaCategory: "NONE",
            },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };
  } catch (error) {
    console.error("Error preparing post body:", error);
    throw error;
  }
};

const registerMediaUpload = async (headers, accessToken) => {
  try {
    const data = await fetchUserLinkedinProfile(headers);
    const response = await axios.post(
      "https://api.linkedin.com/v2/assets?action=registerUpload",
      {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: `urn:li:person:${data.sub}`,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
          supportedUploadMechanism: ["SYNCHRONOUS_UPLOAD"],
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data.value;
  } catch (error) {
    console.error("Error registering media upload:", error);
    throw error;
  }
};
export async function scheduledLinkedinJob(text, accessToken, mediaUrl = null) {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    };

    const body = await preparePostBody(headers, text, mediaUrl);

    const { data } = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      body,
      {
        headers,
      }
    );

    return data;
  } catch (error) {
    console.log("🚀 ~ scheduledLinkedinJob ~ error:", error);
    throw new Error(error);
  }
}

export const postToLinkedIn = async (
  accessToken,
  text,
  scheduled_at,
  user_id,
  mediaUrl
) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    };

    if (scheduled_at > 0) {
      const scheduledPost = await Post.create({
        text,
        is_scheduled: true,
        scheduled_at: dayjs.unix(scheduled_at),
        user: user_id,
        token: accessToken,
        platform: "linkedin",
        media_url: mediaUrl || null,
      });

      return {
        message: `Post is scheduled at ${dayjs().unix(scheduled_at)}`,
        caption: scheduledPost?.text,
      };
    }

    if (!mediaUrl) {
      const body = await preparePostBody(headers, text);
      const { data } = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        body,
        { headers }
      );
      return data?.id
        ? { message: "Post created successfully", data }
        : new Error("LinkedIn server error", data);
    }

    const { asset, uploadMechanism } = await registerMediaUpload(
      headers,
      accessToken
    );

    const { uploadUrl, headers: uploadHeaders } =
      uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ];

    const binaryMedia = await axios
      .get(mediaUrl, {
        responseType: "arraybuffer",
      })

      .then((response) => Buffer.from(response.data, "binary"));

    const body = await preparePostBody(headers, text, mediaUrl, asset);

    await axios.put(uploadUrl, binaryMedia, { headers });

    const response = await axios.post(
      "https://api.linkedin.com/v2/shares",
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "x-li-format": "json",
        },
      }
    );

    if (response.status !== 201) {
      return response.data.errors[0].message;
    }
    return "Post is shared on LinkedIn successfully.";
  } catch (error) {
    console.error("Error posting to LinkedIn:", error?.message);
    throw error;
  }
};
