// server.js

const express = require("express");
const path = require("node:path");
const { authRouter } = require("./routes/authRouter");
const { pollutionRouter } = require("./routes/pollutionRouter"); // Подключаем новый роутер
const { articleRouter } = require("./routes/articleRouter"); // Добавляем роутер статей
require("dotenv").config();
const server = express();
const cors = require("cors");
const bodyParser = require("body-parser");

const CLIENT_PORT = process.env.CLIENT_PORT || 3000;

server.use(bodyParser.json());
server.use(
  cors({
    origin: `http://localhost:${CLIENT_PORT}`,
    credentials: true, // Разрешение отправки учетных данных (cookies, authorization headers)
  }),
); // Настройка CORS для разрешения запросов с фронта
//server.use(cors());
server.use("/api/auth", authRouter);
server.use("/api/pollutions", pollutionRouter); // Используем новый роутер
server.use("/api/articles", articleRouter); // Используем роутер статей

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
