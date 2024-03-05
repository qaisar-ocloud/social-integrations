import User from "../model/User.js";
import bcrypt from "bcryptjs";
import Otp from "../model/otp.js";
import jwt from "jsonwebtoken";
import nodeMailer from "nodemailer";
import Token from "../model/token.js";
import { error } from "console";
import { platform } from "os";
// import Platform from "../model/platform";
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
    const access_tokens = tokens.map((token) => token.platform);
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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user) {
      const otp = Otp.create({
        email: email,
        otp: Math.floor(Math.random() * 10000),
        expiredIn: new Date().getTime() + 300 * 1000,
      });
      const transpoter = nodeMailer.createTransport({
        service: "outlook",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.MAIL_PASS,
        },
      });
      const options = {
        from: process.env.EMAIL,
        to: email,
        subject: "Reset your Password",
        text: `${otp}`,
      };

      transpoter.sendMail(options, (info, err) => {
        if (err) {
          return res.status(404).json(err);
        }
      });
      res.send(user);
    } else {
      return res
        .status(404)
        .json({ message: "User Not Found, Enter Email again" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { newPassword, newPassword2 } = req.body;
  if (newPassword === newPassword2) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const { otp } = req.body;
    const otpVerified = await Otp.findOne({ otp });
    const timeNow = new Date().getTime();
    const diff = otpVerified?.expiredIn - timeNow;
    let otpAlive;

    if (diff < 0) {
      otpAlive = false;
    } else {
      otpAlive = true;
    }
    if (otpVerified && otpAlive) {
      const user = await User.findByIdAndUpdate(req.params.id, hashedPassword);
      if (user) {
        return res.status(200).json({
          message: "Success",
          id: user._id,
          name: user.name,
          email: user.name,
          token: getToken(req.params.id),
        });
      }
    } else {
      return res.status(400).json({ message: "Wrong Otp, Retry" });
    }
  } else {
    return res.status(400).json({ message: "Passwords did no Matched, Retry" });
  }
};

export const getMe = async (req, res) => {
  const { id, name, email } = await User.findOne(req.params.id);

  return res.status(200).json({ id: id, name: name, email: email });
};

function getToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET);
}
