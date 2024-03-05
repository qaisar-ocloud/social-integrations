import jwt from "jsonwebtoken";
import User from "../model/User.js";

export default async function authenticate(req, res, next) {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log("🚀 ~ authenticate ~ token:", headers.authorization);
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
        (error, jwtResponse) => {
          if (error) {
            return res.status(401).json({ message: error.message });
          } else {
            return jwtResponse;
          }
        }
      );

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized User" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Unauthorized , No Token" });
  }
}
