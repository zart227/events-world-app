// models/pollutionModel.js

const { MongoClient } = require("mongodb");
require("dotenv").config();

const url = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "pollutionData";

async function connectToDatabase() {
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	await client.connect();
	const db = client.db(dbName);
	return { db, client };
}

async function insertPollutionData(data) {
	const { db, client } = await connectToDatabase();
	try {
		const collection = db.collection("pollutionHistory");
		const result = await collection.insertOne(data);
		return result;
	} finally {
		await client.close();
	}
}

async function getPollutionHistory() {
	const { db, client } = await connectToDatabase();
	try {
		const collection = db.collection("pollutionHistory");
		const history = await collection.find({}).toArray();
		return history;
	} finally {
		await client.close();
	}
}

module.exports = {
	insertPollutionData,
	getPollutionHistory,
};
