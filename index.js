const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const userService = require("./routes/user.router");
const app = express();
const path = require("path");
const port = process.env.PORT || 1234;
const adminRouter = require("./routes/admin.router")
const cookieParser = require('cookie-parser');


mongoose
  .connect(process.env.MONGODB)
  .then(() => {
    console.log("MongoDB is ready");
    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDB error: ${err}`);
  });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

app.use("/admin", adminRouter);
app.use("/user", userService);

app.use((err, req, res, next) => {
  let message;
  let statusCode;
  if (!!err.statusCode && err.statusCode <= 500) {
    message = err.message;
    statusCode = err.statusCode;
  } else if (err.message === "jwt expired") {
    message = err.message;
    statusCode = 400;
  } else {
    message = err.message;
    statusCode = 500;
  }

  let resp = { status: false, message, result: {} };
  if (!!err.data) {
    resp.result = err.data;
  }
  console.log(err.statusCode, err.message);
  res.status(statusCode).send(resp);
});

app.get("/", (__, res) => {
  res.json({ status: 200, message: "Welcome to the API By LeQuocHuy!" });
});
