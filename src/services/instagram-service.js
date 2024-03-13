export default function getMyInstagram() {
  return "instagram/me";
}

export async function postToInstagram(
  accessToken,
  text,
  scheduled_at,
  image_url
) {
  const BASEURL = `https://graph.facebook.com/v19.0/${accessToken?.platform_user_id}`;
  let url = BASEURL + "/media";
  const params = new URLSearchParams();
  params.append("image_url", image_url);
  params.append("caption", text);

  // console.log("🚀 ~ url1:", url);
  try {
    const postContainer = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Authorization: `Bearer ${accessToken}`,
      },
    });
    return postContainer;
    // if (postContainer.data.id.length > 0) {
    //   url = BASEURL + "/media_publish";
    //   const publishParams = new URLSearchParams();
    //   publishParams.append("creation_id", postContainer.data.id);

    //   // console.log("🚀 ~ url2:", url);
    //   const publishedPost = await axios.post(url, publishParams, {
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded",
    //       Authorization: `Bearer ${accessToken}`,
    //     },
    //   });

    //   // console.log("🚀 ~ publishedPost:", publishedPost);
    //   if (publishedPost.data.id.length > 0) {
    //     return { message: "Post Published Successfully" };
    //   }
    //   return { error: "Instagram Server Error" };
    // }
  } catch (error) {
    return error.response.data;
  }
}
