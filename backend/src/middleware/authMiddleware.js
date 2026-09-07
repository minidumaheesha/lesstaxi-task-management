import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authorizationHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error("JWT_SECRET is not configured"));
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "lesstaxi-task-manager-api",
      audience: "lesstaxi-task-manager-client",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    return next(error);
  }

  if (
    typeof decodedToken !== "object" ||
    decodedToken === null ||
    typeof decodedToken.sub !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(decodedToken.sub)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }

  try {
    const user = await User.findById(decodedToken.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user associated with this token no longer exists",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    return next();
  };
};