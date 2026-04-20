const jwt = require("jsonwebtoken");
const { getUserProfileById } = require("../services/storeService");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = getUserProfileById(payload.id);

    if (!user) {
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ." });
    }

    if (user.status === "locked") {
      return res.status(403).json({ message: "Tài khoản của bạn hiện đang bị khóa." });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token không hợp lệ." });
  }
};
