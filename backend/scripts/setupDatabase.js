const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'pollutionData';

async function setupDatabase() {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        console.log('Connected to database');
        const db = client.db(dbName);
        await db.createCollection('pollutionHistory');
        console.log('Collection created');
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

setupDatabase();
