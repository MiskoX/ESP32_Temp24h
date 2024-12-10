const cors = require("cors");

module.exports = cors({
  origin: "*",
  methods: ["GET", "POST"],
});
