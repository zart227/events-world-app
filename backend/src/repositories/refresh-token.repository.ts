import { prisma } from '../db/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';

export interface RefreshTokenEntity {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

function toEntity(row: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}): RefreshTokenEntity {
  return {
    id: row.id,
    user_id: row.userId,
    token_hash: row.tokenHash,
    expires_at: row.expiresAt,
    revoked_at: row.revokedAt,
    created_at: row.createdAt,
  };
}

export const refreshTokenRepository = {
  async create(
    data: { userId: string; tokenHash: string; expiresAt: Date },
    client: DbClient = prisma,
  ): Promise<RefreshTokenEntity> {
    const row = await client.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
    return toEntity(row);
  },

  async findByHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    return row ? toEntity(row) : null;
  },

  async revokeById(id: string, client: DbClient = prisma): Promise<void> {
    await client.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  },

  async deleteExpired(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  },
};

export type RefreshTokenRepository = typeof refreshTokenRepository;
