import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    // Try to get token from cookies or Authorization header
    let token = req.cookies?.token;

    // If no token in cookies, check Authorization header
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Authentication required. Please login.",
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    if (!decode) {
      return res.status(401).json({
        message: "Invalid token. Please login again.",
        success: false,
      });
    }

    req.id = decode.userId;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(401).json({
      message: "Authentication failed. Please login again.",
      success: false,
    });
  }
};

export default isAuthenticated;
