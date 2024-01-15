const jwt = require("jsonwebtoken");
const ProjectError = require("../helpers/error.helper");

const verifyToken = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.get("Authorization");
    if (authHeader) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      token = req.cookies.accessToken; 
    }

    if (!token) {
      const err = new ProjectError("Vui lòng đăng nhập để tiếp tục!");
      err.statusCode = 401;
      throw err;
    }

    try {
      const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (!decodedToken) {
        const err = new ProjectError("Vui lòng đăng nhập để tiếp tục!");
        err.statusCode = 401;
        throw err;
      }

      req.user = decodedToken;
      next();
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = verifyToken;
