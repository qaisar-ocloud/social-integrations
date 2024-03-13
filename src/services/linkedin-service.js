import axios from "axios";
import dayjs from "dayjs";
import FormData from "form-data";
import Post from "../model/post.js";

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
      return saveScheduledPost(
        text,
        scheduled_at,
        user_id,
        accessToken,
        mediaUrl ? mediaUrl : null
      );
    }

    if (!mediaUrl) {
      const bodyWithoutMedia = await preparePostBody(headers, text);
      return publishToLinkedin(bodyWithoutMedia, headers);
    }
    return handleLinkedinMediaPost(headers, accessToken, mediaUrl, text);
  } catch (error) {
    console.error("Error posting to LinkedIn:", error?.message);
    throw error;
  }
};

async function saveScheduledPost(
  text,
  scheduled_at,
  user_id,
  accessToken,
  mediaUrl = null
) {
  const scheduledPost = await Post.create({
    text,
    is_scheduled: true,
    scheduled_at: dayjs.unix(scheduled_at),
    user: user_id,
    token: accessToken,
    platform: "linkedin",
    media_url: mediaUrl ? mediaUrl : null,
  });

  return {
    message: `Post is scheduled at ${dayjs().unix(scheduled_at)}`,
    caption: scheduledPost?.text,
  };
}

async function uplaodMediaToLinkedinContainer(
  mediaUrl,
  uploadUrl,
  accessToken
) {
  const imageFile = await axios.get(mediaUrl, { responseType: "stream" });
  const imageStream = imageFile.data;

  const form = new FormData();
  form.append("file", imageStream);
  return await axios.post(uploadUrl, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function publishToLinkedin(body, headers) {
  const response = await axios.post(
    "https://api.linkedin.com/v2/ugcPosts",
    body,
    { headers }
  );

  if (response.status !== 201) {
    return response.data.errors[0].message;
  }
  return { message: "Post created successfully", success: true };
}

async function registerMediaUpload(headers, accessToken) {
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
}

async function fetchUserLinkedinProfile(headers) {
  try {
    const { data } = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers,
    });
    return data;
  } catch (error) {
    throw new Error("Error fetching LinkedIn profile:", error);
  }
}

async function handleLinkedinMediaPost(headers, accessToken, mediaUrl, text) {
  const { asset, uploadMechanism } = await registerMediaUpload(
    headers,
    accessToken
  );

  const { uploadUrl } =
    uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ];

  const uploadMedia = await uplaodMediaToLinkedinContainer(
    mediaUrl,
    uploadUrl,
    accessToken
  );

  if (uploadMedia.status !== 201) {
    return new Error("Error in Uploading Media to Linkedin");
  }

  const bodyWithMedia = await preparePostBody(headers, text, mediaUrl, asset);

  return publishToLinkedin(bodyWithMedia, headers);
}
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

export const scheduledLinkedinJob = async (
  text,
  accessToken,
  mediaUrl = null
) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    };
    if (mediaUrl) {
      return handleLinkedinMediaPost(headers, accessToken, mediaUrl, text);
    }

    const body = await preparePostBody(headers, text, mediaUrl);
    return publishToLinkedin(body, headers);
  } catch (error) {
    throw new Error(error);
  }
};
