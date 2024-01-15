const Users = require("../models/user.model");
const isAdmin = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const user = await Users.findOne({
      _id: user_id,
    });

    if (!user) {
      return res.status(500).json({
        status: false,
        message: "Người dùng không tồn tại",
      });
    }

    if (user.role === "admin") {
      next();
    } else {
      return res.status(400).json({
        status: false,
        message: "Access denied. You are not an Admin.",
      });
    }
  } catch (error) {
    next(error);
  }
};
module.exports = isAdmin;
