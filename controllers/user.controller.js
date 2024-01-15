const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { emailSMPT } = require("../helpers/email.helper");
const { Types } = require("mongoose");
const devices = require("../helpers/device.helper");
const configs = require("../helpers/config.helper");

exports.register = async (req, res, next) => {
  const { username, password, confirm_password, email } = req.body;

  try {
    if (!username || !password || !confirm_password || !email) {
      return res
        .status(200)
        .json({ status: false, message: "Vui lòng nhập đầy đủ thông tin" });
    }

    if (password !== confirm_password) {
      return res
        .status(200)
        .json({ status: false, message: "Mật khẩu không trùng khớp!" });
    }

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(200).json({
        status: false,
        message: "Người dùng đã tồn tại. Vui lòng hãy đăng nhập",
      });
    }
    const userID = new Types.ObjectId().toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const accessToken = jwt.sign(
      { user_id: userID, email, role: "member" },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_LIFE,
      }
    );

    const refreshToken = jwt.sign(
      { user_id: userID, email, role: "member" },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_LIFE,
      }
    );

    await User.create({
      _id: userID,
      refreshToken: refreshToken,
      money: 0,
      total_money: 0,
      banned: false,
      ip: req.connection.remoteAddress,
      device: (await devices.device(req)).source,
      username,
      email,
      password: hashedPassword,
    });

    res.status(200).json({
      status: true,
      message: "Đăng ký thành công",
      result: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(200)
        .json({ status: false, message: "Vui lòng nhập đầy đủ thông tin" });
    } else {
      const user = await User.findOne({ email });
      if (!user)
        res
          .status(500)
          .json({ status: false, message: "Không tồn tại người dùng" });
      if (user && (await bcrypt.compare(password, user.password))) {
        let accessToken = jwt.sign(
          { user_id: user._id, email: user.email, role: user.role },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: process.env.ACCESS_TOKEN_LIFE,
          }
        );
        let refreshToken = jwt.sign(
          { user_id: user._id, email: user.email, role: user.role },
          process.env.REFRESH_TOKEN_SECRET,
          {
            expiresIn: process.env.REFRESH_TOKEN_LIFE,
          }
        );
        if (!user.refreshToken) {
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                refreshToken: refreshToken,
              },
            }
          );
        } else {
          refreshToken = user.refreshToken;
        }
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              ip: req.connection.remoteAddress,
              device: (await devices.device(req)).source,
            },
          }
        );
        res.cookie("accessToken", accessToken, { httpOnly: true });
        res.cookie("refreshToken", refreshToken, { httpOnly: true });
        res.status(200).json({
          status: true,
          message: "Đăng nhập thành công",
          result: {
            accessToken,
            refreshToken,
          },
        });
      }
      res.status(401).json({ status: false, message: "Mật khẩu không đúng" });
    }
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  const { refreshToken } = req.body;
  try {
    await User.findOneAndUpdate(
      { refreshToken: refreshToken },
      { $set: { refreshToken: "" } }
    );
    return res.status(200).json({
      status: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  const { user_id, role, email } = req.decode_refreshToken;
  const { refreshToken } = req.body;

  try {
    const user = await User.findOne({
      _id: user_id,
    });
    if (!user) {
      return res.status(500).json({
        status: false,
        message: "Người dùng không tồn tại",
      });
    }

    const newAccessToken = jwt.sign(
      { user_id: user_id, email, role },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_LIFE,
      }
    );
    const newRefreshToken = jwt.sign(
      { user_id: user_id, email, role },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_LIFE,
      }
    );
    await User.updateOne(
      { refreshToken: refreshToken },
      {
        $set: {
          refreshToken: "",
          updatedAt: new Date(),
        },
      }
    ),
      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await User.updateOne(
      { _id: user_id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "Thay đổi mật khẩu thành công",
    });
  } catch (error) {
    next(error);
  }
};

exports.getByUserID = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const result = await User.findOne(
      { _id: user_id },
      {
        projection: {
          password: 0,
          refreshToken: 0,
          forgot_password_token: 0,
          ip: 0,
        },
      }
    )
      .select("-password -refreshToken -ip -forgot_password_token")
      .exec();
    if (result) {
      return res.status(200).json({
        status: true,
        message: "Lấy dữ liệu thông tin thành công",
        result,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateByID = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await User.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...req.body,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    return res.status(200).json({
      status: true,
      message: "Cập nhật thông tin thành công",
      result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMoney = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, money } = req.body;

    if (type === "Add") {
      await configs.PlusCredits(id, money);
    } else if (type === "Apart") {
      await configs.RemoveCredits(id, money);
    }
    return res.status(200).json({
      status: true,
      message: "Cập nhật money thành công",
    });
  } catch (error) {
    next(error);
  }
};

exports.updateByUserID = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const result = await User.findOneAndUpdate(
      { _id: user_id },
      {
        $set: {
          ...req.body,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        projection: {
          password: 0,
          refreshToken: 0,
          forgot_password_token: 0,
          ip: 0,
          money: 0,
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "Cập nhật thông tin thành công",
      result,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const forgot_password_token = jwt.sign(
      { user_id: _id, email: req.body.email },
      process.env.FORGOT_PASSWORD_TOKEN,
      {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_LIFE,
      }
    );
    emailSMPT.sendEmail(
      req.body.email,
      "Lấy lại mật khẩu",
      `<html>
      <head>
        <style>
          /* Thêm CSS cho nút "Reset Password" */
          .reset-button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h2>Reset Password</h2>
        <p>A password change has been requested for your account. If this was you, please click the button below to reset your password:</p>
        <a class="reset-button" style="color: #fff;"  href="${process.env.CLIENT_URL}/user/verify-forgot-password?forgot_password_token=${forgot_password_token}">Reset Password</a>
      </body>
    </html>`
    );

    const result = await User.updateOne(
      { _id: _id },
      {
        $set: {
          forgot_password_token,
          updatedAt: new Date(),
        },
      }
    );

    return res
      .status(200)
      .json({ status: true, message: "Gửi yêu cầu lấy mật khẩu thành công" });
  } catch (error) {
    next(error);
  }
};

exports.verifyForgotPassword = async (req, res, next) => {
  try {
    const { forgot_password_token } = req.query;
    const urlRedirect = `${process.env.CLIENT_REDIRECT_RESET_PASSWORD}?forgot_password_token=${forgot_password_token}`;

    return res.redirect(urlRedirect);
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { user_id } = req.decode_forgot_password_verify_token;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await User.updateOne(
      { _id: user_id },
      {
        $set: {
          forgot_password_token: "",
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "Thay đổi mật khẩu thành công",
    });
  } catch (error) {
    next(error);
  }
};

exports.isPasswordValid = async (password) => {
  let flag = 0;
  if (
    password.indexOf("!") == -1 &&
    password.indexOf("@") == -1 &&
    password.indexOf("#") == -1 &&
    password.indexOf("$") == -1 &&
    password.indexOf("*") == -1
  ) {
    return false;
  }
  for (let ind = 0; ind < password.length; ind++) {
    let ch = password.charAt(ind);
    if (ch >= "a" && ch <= "z") {
      flag = 1;
      break;
    }
    flag = 0;
  }
  if (!flag) {
    return false;
  }
  flag = 0;
  for (let ind = 0; ind < password.length; ind++) {
    let ch = password.charAt(ind);
    if (ch >= "A" && ch <= "Z") {
      flag = 1;
      break;
    }
    flag = 0;
  }
  if (!flag) {
    return false;
  }
  flag = 0;
  for (let ind = 0; ind < password.length; ind++) {
    let ch = password.charAt(ind);
    if (ch >= "0" && ch <= "9") {
      flag = 1;
      break;
    }
    flag = 0;
  }
  if (flag) {
    return true;
  }
  return false;
};
