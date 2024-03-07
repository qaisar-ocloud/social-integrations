import mongoose from "mongoose";
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});
if (mongoose.modelNames().includes("User")) {
  mongoose.deleteModel("User");
}
const User = mongoose.model("User", userSchema);
export default User;
