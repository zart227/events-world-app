// server.js

const express = require("express");
const path = require("node:path");
const { authRouter } = require("./routes/authRouter");
const { pollutionRouter } = require("./routes/pollutionRouter"); // Подключаем новый роутер
require("dotenv").config();
const server = express();
const cors = require("cors");
const bodyParser = require("body-parser");

server.use(bodyParser.json());
server.use(cors());
server.use("/auth", authRouter);
server.use("/pollutions", pollutionRouter); // Используем новый роутер

// статика frontend React
server.use(express.static(path.join(__dirname, "../build")));

// всё остальное на index.html
server.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "../build", "index.html"));
});

const SERVER_PORT = process.env.SERVER_PORT || 3001;
server.listen(SERVER_PORT, () => {
	console.log(`сервер стартовал на порте ${SERVER_PORT}`);
});

// открывает ссылку в браузере. может работать не на всех платформах
const url = `http://localhost:${SERVER_PORT}`;
const start =
	process.platform === "darwin"
		? "open"
		: process.platform === "win32"
		? "start"
		: "xdg-open";
require("child_process").exec(start + " " + url);
