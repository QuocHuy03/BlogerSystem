const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
    refreshToken: {
      type: String,
    },
    banned: {
      type: Boolean,
    },
    ip: {
      type: String,
    },
    money: {
      type: Number,
    },
    total_money: {
      type: Number,
    },
    device: {
      type: String,
    },
    role: {
      type: String,
      enum: ["member", "admin", "employee"],
      default: "member",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", postSchema);
