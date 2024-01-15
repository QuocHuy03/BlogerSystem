const express = require("express");
const auth = require("../middlewares/auth.js");
const isAdmin = require("../middlewares/isAdmin.js");
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

module.exports = router;
