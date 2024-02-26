import mongoose from "mongoose";
const otpSchema = mongoose.Schema({
  email: {
    type: String,
  },
  otp: {
    type: String,
  },
  expiredIn: {
    type: Number,
  },
});
const Otp = new mongoose.model("Otp", otpSchema);
export default Otp;
