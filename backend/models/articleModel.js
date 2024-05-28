// backend/models/articleModel.js

const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");
require("dotenv").config();

const url = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "articles";

async function connectToDatabase() {
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  const db = client.db(dbName);
  return { db, client };
}

async function addArticle(article) {
  const { db, client } = await connectToDatabase();
  try {
    const collection = db.collection("articles");
    const result = await collection.insertOne(article);
    return result;
  } finally {
    await client.close();
  }
}

async function getArticles() {
  const { db, client } = await connectToDatabase();
  try {
    const collection = db.collection("articles");
    const articles = await collection.find({}).toArray();
    return articles;
  } finally {
    await client.close();
  }
}

async function getArticleById(id) {
  const { db, client } = await connectToDatabase();
  try {
    const collection = db.collection("articles");
    // console.log(`id: ${id}`);
    const article = await collection.findOne({ _id: new ObjectId(id) });
    return article;
  } finally {
    await client.close();
  }
}

async function removeAllArticles() {
  const { db, client } = await connectToDatabase();
  try {
    const collection = db.collection("articles");
    const result = await collection.deleteMany();
    return result.deletedCount;
  } finally {
    await client.close();
  }
}

async function deleteArticleById(id) {
  const { db, client } = await connectToDatabase();
  try {
    const collection = db.collection("articles");
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount;
  } finally {
    await client.close();
  }
}

module.exports = {
  addArticle,
  getArticles,
  getArticleById,
  removeAllArticles,
  deleteArticleById,
};
