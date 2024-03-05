import User from "../model/User.js";
import bcrypt from "bcryptjs";
import Otp from "../model/otp.js";
import jwt from "jsonwebtoken";
import nodeMailer from "nodemailer";
import Token from "../model/token.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ message: "you are missing one required Entry" });
  }
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "the user already Exists, plz Login" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(200).json({
        message: "Success",
        id: user._id,
        name: user.name,
        email: user.email,
        token: getToken(user._id),
      });
    }
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid password" });
    }

    const tokens = await Token.find({ user: user?.id });
    const access_tokens = tokens?.map((token) => token.platform);
    res.status(200).json({
      message: "Success",
      id: user._id,
      name: user.name,
      email: email,
      token: getToken(user._id),
      access_tokens,
    });
  } catch (error) {
    console.log("🚀 ~ loginUser ~ error:", error);
    res.status(500).json({ message: error.message });
  }
};

function getToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET);
}
