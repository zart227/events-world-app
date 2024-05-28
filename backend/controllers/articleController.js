// backend/controllers/articleController.js

// const { v4: uuidv4 } = require("uuid");
const {
  addArticle,
  getArticles,
  getArticleById,
  removeAllArticles,
  deleteArticleById,  
} = require("../models/articleModel");

const createArticle = async (req, res) => {
  const { title, short_desc, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      message: "Необходимо указать заголовок и описание статьи",
    });
  }

  const newArticle = {
    //id: uuidv4(),
    title,
    short_desc,
    description,
    created_at: new Date(),
  };

  try {
    const result = await addArticle(newArticle);
    res.status(201).json({ id: result.insertedId });
  } catch (error) {
    res.status(500).json({
      message: "Ошибка при создании статьи",
      error,
    });
  }
};

const getAllArticles = async (req, res) => {
  try {
    const articles = await getArticles();
    const articlesWithId = articles.map((article) => ({
      ...article,
      id: article._id,
      _id: undefined, // Удаляем поле _id
    }));
    res.status(200).json(articlesWithId);
  } catch (error) {
    res.status(500).json({
      message: "Ошибка при получении списка статей",
      error,
    });
  }
};

const getArticle = async (req, res) => {
  const { id } = req.params;
//   console.log(`id: ${id}`);
  try {
    const article = await getArticleById(id);
    if (!article) {
    //   console.log(`id: ${id}`);
      return res.status(404).json({ message: "Статья не найдена" });
    }
    res.status(200).json({
		...article,
		id: article._id,
		_id: undefined,  // Удаляем поле _id
  });
  } catch (error) {
    res.status(500).json({
      message: "Ошибка при получении статьи",
      error,
    });
  }
};

const clearAllArticles = async (req, res) => {
	try {
	  const deletedCount = await removeAllArticles();
	  if (deletedCount === 0) {
		res.status(404).json({ message: "Nothing to delete!" });
	  } else {
		res.status(204).send();
	  }	  
	} catch (error) {
	  res.status(500).json({ message: "Internal server error", error });
	}
  };

const removeArticleById = async (req, res) => {
	const { id } = req.params;
	try {
	  const deletedCount = await deleteArticleById(id);
	  if (deletedCount === 0) {
		res.status(404).json({ message: "Article not found" });
	  } else {
		res.status(204).send();
	  }
	} catch (error) {
	  res.status(500).json({ message: "Internal server error", error });
	}
  };

module.exports = {
  createArticle,
  getAllArticles,
  getArticle,
  clearAllArticles,
  removeArticleById,
};
