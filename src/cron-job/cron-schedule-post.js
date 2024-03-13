import cron from "node-cron";
import Post from "../model/post.js";
import { scheduledLinkedinJob } from "../services/linkedin-service.js";

cron.schedule("*/5 * * * *", async () => {
  try {
    const currentTime = new Date();
    const scheduledPosts = await Post.find({
      is_scheduled: true,
      scheduled_at: { $lte: currentTime },
    });

    if (scheduledPosts.length > 0) {
      scheduledPosts.forEach(async (post) => {
        const { text, token: accessToken, media_url } = post;
        if (post?.platform === "linkedin") {
          const response = await scheduledLinkedinJob(
            text,
            accessToken,
            media_url && media_url !== "null" ? media_url : null
          );

          if (response?.id) {
            await Post.findByIdAndUpdate(post._id, { is_scheduled: false });

            return {
              message: `Successsfully posted cheduled at:", ${post?.scheduled_at}`,
            };
          }

          return {
            message: `Linkedin server error for post  ${post?._id}`,
          };
        }
      });
    }
  } catch (error) {
    console.error("Error checking scheduled posts:", error);
    throw error;
  }
});
