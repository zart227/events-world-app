import { randomUUID } from 'node:crypto';

export interface UserEntity {
  id: string;
  email: string;
  password: string;
}

/**
 * Временное in-memory хранилище пользователей (как в исходном проекте).
 * Будет заменено на PostgreSQL в рамках миграции БД.
 */
const users = new Map<string, UserEntity>();

export const userRepository = {
  async create(data: { email: string; password: string }): Promise<UserEntity> {
    const user: UserEntity = { id: randomUUID(), ...data };
    users.set(user.email, user);
    return user;
  },

  async findByEmail(email: string): Promise<UserEntity | null> {
    return users.get(email) ?? null;
  },
};

export type UserRepository = typeof userRepository;
