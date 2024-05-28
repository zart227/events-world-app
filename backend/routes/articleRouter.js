// backend/routes/articleRouter.js

const express = require("express");
const {
  createArticle,
  getAllArticles,
  getArticle,
  clearAllArticles,
  removeArticleById,
} = require("../controllers/articleController");

const router = express.Router();

router.post("/", createArticle);
router.get("/", getAllArticles);
router.get("/:id", getArticle);
router.delete("/:id", removeArticleById);
router.delete("/", clearAllArticles); // Этот роут для удаления всех статей

module.exports = { articleRouter: router };
