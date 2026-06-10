import { ObjectId, type Collection, type Document } from 'mongodb';
import { getDb } from '../db/mongo.js';
import type { ArticleDto, CreateArticleDto } from '../dto/article.dto.js';

const COLLECTION = 'articles';

function collection(): Collection<Document> {
  return getDb().collection(COLLECTION);
}

function toDto(doc: Document): ArticleDto {
  return {
    id: String(doc._id),
    title: doc.title,
    short_desc: doc.short_desc,
    description: doc.description,
    created_at: doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at,
  };
}

function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export const articleRepository = {
  async create(data: CreateArticleDto): Promise<ArticleDto> {
    const doc = { ...data, created_at: new Date() };
    const result = await collection().insertOne(doc);
    return toDto({ _id: result.insertedId, ...doc });
  },

  async findAll(): Promise<ArticleDto[]> {
    const docs = await collection().find({}).sort({ created_at: -1 }).toArray();
    return docs.map(toDto);
  },

  async findById(id: string): Promise<ArticleDto | null> {
    const objectId = toObjectId(id);
    if (!objectId) return null;
    const doc = await collection().findOne({ _id: objectId });
    return doc ? toDto(doc) : null;
  },

  async deleteById(id: string): Promise<number> {
    const objectId = toObjectId(id);
    if (!objectId) return 0;
    const result = await collection().deleteOne({ _id: objectId });
    return result.deletedCount;
  },

  async deleteAll(): Promise<number> {
    const result = await collection().deleteMany({});
    return result.deletedCount;
  },
};

export type ArticleRepository = typeof articleRepository;
