import mongoose from "mongoose";

const tokenSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "User",
        },
        access_token: {
            type: String,
            required: true,
        },
        id_token: {
            type: String,
        },
        expiry_date: {
            type: Date,
            required: false,
        },
        token_type: {
            type: String,
        },
        platform: {
            type: String,
            required: true
        },
        platform_user_id: {
            type: String,
        },
        permission: Array,


    },
    {
        timestamps: true,
    }
);

const Token = mongoose.model("Token", tokenSchema);
export default Token;
