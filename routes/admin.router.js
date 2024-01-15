const express = require("express");
const auth = require("../middlewares/auth.js");
const isAdmin = require("../middlewares/isAdmin.js");
const User = require("../models/user.model.js");
const router = express.Router();

router.get("/", auth, isAdmin, (req, res) => {
  console.log(req.user);
  try {
    res.render("admin/index.ejs");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/login", (req, res) => {
  try {
    res.render("admin/login.ejs");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/register", (req, res) => {
  try {
    res.render("admin/register.ejs");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/profile", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    console.log(users);
    res.render("admin/profile/index.ejs", { users });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/profile/edit/:id", auth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);;
    res.render("admin/profile/edit.ejs", { user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
