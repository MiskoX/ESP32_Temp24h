const express = require("express");
const tempController = require("../controllers/tempController");

const router = express.Router();

// Endpoint do zapisu temperatury
router.post("/", tempController.saveTemperature);

// Endpoint do pobierania temperatury
router.get("/", tempController.getTemperatures);

module.exports = router;
