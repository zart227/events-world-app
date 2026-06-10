import { MongoClient, type Db } from 'mongodb';
import { config } from '../config/env.js';
import { logger } from '../logger/logger.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(config.mongo.uri);
  await client.connect();
  db = client.db(config.mongo.dbName);
  logger.info({ uri: config.mongo.uri, db: config.mongo.dbName }, 'MongoDB connected');
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('MongoDB is not connected. Call connectMongo() first.');
  }
  return db;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
}
