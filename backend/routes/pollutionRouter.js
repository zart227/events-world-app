// routes/pollutionRoutes.js

const express = require("express");
const {
	savePollutionData,
	getPollutionData,
} = require("../controllers/pollutionController");

const router = express.Router();

router.post("/", savePollutionData);
router.get("/", getPollutionData);

module.exports = { pollutionRouter: router };
