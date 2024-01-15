const express = require("express");
const auth = require("../middlewares/auth.js");
const isAdmin = require("../middlewares/isAdmin.js");
const User = require("../models/user.model.js");
const router = express.Router();
const { mongoose } = require("mongoose");

router.get("/", auth, isAdmin, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(user_id) });
    res.render("admin/index.ejs", { user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/login", (req, res, next) => {
  try {
    res.render("admin/login.ejs");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/register", (req, res, next) => {
  try {
    res.render("admin/register.ejs");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/profile", auth, isAdmin, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(user_id) });
    const users = await User.find().sort({ createdAt: -1 });
    res.render("admin/profile/index.ejs", { users, user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/profile/edit/:id", auth, isAdmin, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(user_id) });
    const id = req.params.id;
    const edituser = await User.findById(id);
    res.render("admin/profile/edit.ejs", { edituser, user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
