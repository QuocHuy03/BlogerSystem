const express = require("express");
const userController = require("../controllers/user.controller.js");
const validate = require("../helpers/validate.helper.js");
const User = require("../models/user.model.js");
const { body, query } = require("express-validator");
const auth = require("../middlewares/auth.js");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const isAdmin = require("../middlewares/isAdmin.js");

router.post(
  "/register",
  [
    body("username")
      .trim()
      .not()
      .notEmpty()
      .withMessage("Tên người dùng là bắt buộc")
      .isLength({ min: 5 })
      .withMessage("Vui lòng nhập tên hợp lệ, dài tối thiểu 5 ký tự")
      .custom(async (value) => {
        try {
          const status = await User.findOne({ username: value });
          if (status) {
            return Promise.reject("Người dùng đã tồn tại");
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email là bắt buộc")
      .isEmail()
      .withMessage("Thông tin email không hợp lệ!")
      .custom(async (value) => {
        try {
          const status = await User.findOne({ email: value });
          if (status) {
            return Promise.reject("Email đã tồn tại");
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (password) => {
        try {
          const status = await userController.isPasswordValid(password);

          if (!status) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),
    body("confirm_password")
      .trim()
      .notEmpty()
      .withMessage("Nhập lại mật khẩu là bắt buộc")
      .custom((value, { req }) => {
        if (value != req.body.password) {
          return Promise.reject("Mật khẩu không khớp!");
        }
        return true;
      }),
  ],
  validate.validateRequest,
  userController.register
);
router.post(
  "/login",
  [
    body("email")
      .trim()
      .not()
      .notEmpty()
      .withMessage("Email là bắt buộc")
      .isEmail({ min: 5 })
      .withMessage("Vui lòng email hợp lệ")
      .custom(async (value) => {
        try {
          const status = await User.findOne({ email: value });
          if (!status) {
            return Promise.reject("Email không tồn tại");
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (password) => {
        try {
          const status = await userController.isPasswordValid(password);
          if (!status) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }
        } catch (err) {
          return Promise.reject(err);
        }
      })
      .withMessage("Thông tin không hợp lệ!"),
  ],
  validate.validateRequest,
  userController.login
);

router.post("/logout", auth, userController.logout);

router.post(
  "/refresh-token",
  [
    body("refreshToken")
      .trim()
      .notEmpty()
      .withMessage("RefreshToken là bắt buộc")
      .custom(async (value, { req }) => {
        try {
          const [decode_refreshToken, refreshToken] = await Promise.all([
            jwt.verify(
              value,
              process.env.REFRESH_TOKEN_SECRET,
              (err, decoded) => {
                if (err) {
                  return Promise.reject(
                    "Token verification failed:",
                    err.message
                  );
                } else {
                  return decoded;
                }
              }
            ),
            User.findOne({ refreshToken: value }),
          ]);
          if (refreshToken === null) {
            return Promise.reject("Người dùng không tồn tại");
          }
          req.decode_refreshToken = decode_refreshToken;
          return true;
        } catch (error) {
          if (error instanceof jwt.JsonWebTokenError) {
            return Promise.reject(error.message);
          } else {
            return Promise.reject(error.message);
          }
        }
      }),
  ],
  validate.validateRequest,
  userController.refreshToken
);

router.post(
  "/forgot-password",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email là bắt buộc")
      .isEmail()
      .withMessage("Thông tin email không hợp lệ")
      .custom(async (value, { req }) => {
        const result = await User.findOne({ email: value });
        if (result === null) {
          return Promise.reject("Người dùng không tồn tại");
        }
        req.user = result;
      }),
  ],
  validate.validateRequest,
  userController.forgotPassword
);

router.get(
  "/verify-forgot-password",
  [
    query("forgot_password_token").custom(async (value) => {
      if (!value) {
        return Promise.reject("Mã xác minh quên mật khẩu là bắt buộc");
      }
      try {
        const decode_forgot_password_verify_token = await jwt.verify(
          value,
          process.env.FORGOT_PASSWORD_TOKEN,
          (err, decoded) => {
            if (err) {
              return Promise.reject("Token verification failed:", err.message);
            } else {
              return decoded;
            }
          }
        );

        const { user_id } = decode_forgot_password_verify_token;

        const user = await User.findOne({ _id: user_id });

        if (user === null) {
          return Promise.reject("Người dùng không tồn tại");
        }
        if (user?.forgot_password_token !== value) {
          return Promise.reject("Mã xác minh quên mật khẩu không hợp lệ");
        }
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
          return Promise.reject(error.message);
        } else {
          return Promise.reject(error.message);
        }
      }
    }),
  ],
  validate.validateRequest,
  userController.verifyForgotPassword
);

router.post(
  "/reset-password",
  [
    body("forgot_password_token")
      .trim()
      .notEmpty()
      .withMessage("Mã xác minh quên mật khẩu là bắt buộc")
      .custom(async (value, { req }) => {
        console.log(value);
        try {
          const decode_forgot_password_verify_token = await jwt.verify(
            value,
            process.env.FORGOT_PASSWORD_TOKEN,
            (err, decoded) => {
              if (err) {
                return Promise.reject(
                  "Token verification failed:",
                  err.message
                );
              } else {
                return decoded;
              }
            }
          );

          const { user_id } = decode_forgot_password_verify_token;

          const user = await User.findOne({ _id: user_id });

          if (user === null) {
            return Promise.reject("Người dùng không tồn tại");
          }
          if (user?.forgot_password_token !== value) {
            return Promise.reject("Mã xác minh quên mật khẩu không hợp l");
          }
          req.decode_forgot_password_verify_token =
            decode_forgot_password_verify_token;
        } catch (error) {
          if (error instanceof jwt.JsonWebTokenError) {
            return Promise.reject(error.message);
          } else {
            return Promise.reject(error.message);
          }
        }
      }),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (password) => {
        try {
          const status = await userController.isPasswordValid(password);
          if (!status) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),

    body("confirm_password")
      .trim()
      .notEmpty()
      .withMessage("Nhập lại mật khẩu là bắt buộc")
      .custom((value, { req }) => {
        if (value != req.body.password) {
          return Promise.reject("Mật khẩu không khớp!");
        }
        return true;
      }),
  ],
  validate.validateRequest,
  userController.resetPassword
);

router.get("/me", auth, userController.getByUserID);

router.patch(
  "/me",
  auth,
  [
    body("username")
      .optional(true)
      .custom(async (value) => {
        try {
          const status = await User.findOne({ username: value });
          if (status) {
            return Promise.reject("Người dùng đã tồn tại");
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),
  ],
  validate.validateRequest,
  userController.updateByUserID
);

router.patch(
  "/update/:id",
  auth,
  isAdmin,
  [
    body("username")
      .optional(true)
      .custom(async (value) => {
        try {
          const status = await User.findOne({ username: value });
          if (status) {
            return Promise.reject("Người dùng đã tồn tại");
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),

    body("email").notEmpty().withMessage("Email là bắt buộc").optional(true),
  ],
  validate.validateRequest,
  userController.updateByUserID
);

router.put(
  "/amount/:id",
  auth,
  isAdmin,
  body("money")
    .trim()
    .notEmpty()
    .withMessage("Money là bắt buộc")
    .isNumeric()
    .withMessage("Money phải là số"),
  validate.validateRequest,
  userController.updateMoney
);

router.put(
  "/change-password",
  auth,
  [
    body("old_password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (value, { req }) => {
        try {
          const isValidPassword = await userController.isPasswordValid(value);
          if (!isValidPassword) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }

          if (req.user) {
            const { user_id } = req.user;
            const user = await User.findOne({ _id: user_id });

            if (!user) {
              return Promise.reject("Người dùng không tồn tại");
            }

            const { password } = user;
            const isMatch = await bcrypt.compare(value, password);

            if (!isMatch) {
              return Promise.reject("Mật khẩu cũ không khớp");
            }

            return true;
          } else {
            return Promise.reject("Token không hợp lệ hoặc thông tin bị thiếu");
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu là bắt buộc")
      .isLength({ min: 8 })
      .custom(async (password) => {
        try {
          const status = await userController.isPasswordValid(password);

          if (!status) {
            return Promise.reject(
              "Nhập mật khẩu hợp lệ, có ít nhất 8 ký tự gồm 1 chữ cái nhỏ, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt($,@,!,#,*)."
            );
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }),

    body("confirm_password")
      .trim()
      .notEmpty()
      .withMessage("Nhập lại mật khẩu là bắt buộc")
      .custom((value, { req }) => {
        if (value != req.body.password) {
          return Promise.reject("Mật khẩu không khớp!");
        }
        return true;
      }),
  ],
  validate.validateRequest,
  userController.changePassword
);

module.exports = router;
