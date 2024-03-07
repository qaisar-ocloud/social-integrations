import mongoose from "mongoose";

const PostSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    text: {
      type: String,
      required: true,
    },
    media_url: {
      type: String,
    },
    is_scheduled: {
      type: Boolean,
      default: false,
    },
    platform: {
      type: String,
      required: true,
    },

    scheduled_at: {
      type: Date,
    },
    token: {
      type: String,
    },
  },

  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", PostSchema);
export default Post;
