const useragent = require("useragent");

exports.device = async (req, res, next) => {
  const userAgentString = req.headers["user-agent"];
  const userAgentInfo = useragent.parse(userAgentString);
  return userAgentInfo;
};
