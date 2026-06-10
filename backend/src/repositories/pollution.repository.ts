import type { Collection, Document } from 'mongodb';
import { getDb } from '../db/mongo.js';
import type { PollutionRecordDto, SavePollutionDto } from '../dto/pollution.dto.js';

const COLLECTION = 'pollutionHistory';

function collection(): Collection<Document> {
  return getDb().collection(COLLECTION);
}

function toDto(doc: Document): PollutionRecordDto {
  return {
    id: String(doc._id),
    address: doc.address,
    latitude: doc.latitude,
    longitude: doc.longitude,
    components: doc.components,
    aqi: doc.aqi,
    dateTime: doc.dateTime,
    created_at: doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at,
  };
}

export const pollutionRepository = {
  async create(data: SavePollutionDto): Promise<PollutionRecordDto> {
    const doc = { ...data, created_at: new Date() };
    const result = await collection().insertOne(doc);
    return toDto({ _id: result.insertedId, ...doc });
  },

  async findAll(): Promise<PollutionRecordDto[]> {
    const docs = await collection().find({}).toArray();
    return docs.map(toDto);
  },
};

export type PollutionRepository = typeof pollutionRepository;
