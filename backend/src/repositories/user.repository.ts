import { prisma } from '../db/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: Date;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

function toEntity(user: {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}): UserEntity {
  return {
    id: user.id,
    email: user.email,
    password_hash: user.passwordHash,
    role: user.role as UserEntity['role'],
    created_at: user.createdAt,
  };
}

export const userRepository = {
  /**
   * Создаёт пользователя вместе с первичными настройками — в одной транзакции.
   */
  async createWithSettings(
    data: {
      email: string;
      passwordHash: string;
      role?: 'user' | 'admin';
    },
    client: DbClient = prisma,
  ): Promise<UserEntity> {
    const run = async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role ?? 'user',
          settings: { create: {} },
        },
      });
      return toEntity(user);
    };

    if ('$transaction' in client) {
      return client.$transaction(run);
    }
    return run(client);
  },

  async findByEmail(email: string, client: DbClient = prisma): Promise<UserEntity | null> {
    const user = await client.user.findUnique({ where: { email } });
    return user ? toEntity(user) : null;
  },

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toEntity(user) : null;
  },
};

export type UserRepository = typeof userRepository;
