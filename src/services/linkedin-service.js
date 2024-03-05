import axios from "axios";
export async function preparePostBody(headers, text) {
  try {
    const { data } = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers,
    });
    const body = {
      author: `urn:li:person:${data.sub}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
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

    return body;
  } catch (error) {
    console.error("Error in preparePostBody:", error);
    throw error;
  }
}
