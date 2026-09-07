import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  return jwt.sign(
    {
      sub: userId.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "lesstaxi-task-manager-api",
      audience: "lesstaxi-task-manager-client",
    }
  );
};

export default generateToken;