import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, UnauthorizedError } from '../../src/errors/app-error.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { authService } from '../../src/services/auth.service.js';
import { tokenService } from '../../src/services/token.service.js';

vi.mock('../../src/repositories/user.repository.js', () => ({
  userRepository: {
    createWithSettings: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../src/services/token.service.js', () => ({
  tokenService: {
    signAccessToken: vi.fn(() => 'access-token'),
    issueRefreshToken: vi.fn(async () => 'refresh-token'),
    rotateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllSessions: vi.fn(),
  },
}));

const users = vi.mocked(userRepository);
const tokens = vi.mocked(tokenService);

const storedUser = {
  id: 'user-id',
  email: 'unit@test.local',
  // bcrypt-хэш строки "password123"
  password_hash: '$2b$10$1mcEQkai4sbF3NxzfJUmMeFwIvhqacL5Zh5u.gY21EKAQ5l/PuPji',
  role: 'user' as const,
  created_at: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService (unit)', () => {
  it('register: конфликт при существующем email', async () => {
    users.findByEmail.mockResolvedValue(storedUser);
    await expect(
      authService.register({ email: 'unit@test.local', password: 'password123' }),
    ).rejects.toThrow(ConflictError);
    expect(users.createWithSettings).not.toHaveBeenCalled();
  });

  it('register: хэширует пароль перед сохранением и выдаёт пару токенов', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.createWithSettings.mockResolvedValue(storedUser);

    const result = await authService.register({ email: 'Unit@Test.Local', password: 'password123' });

    const args = users.createWithSettings.mock.calls[0]![0];
    expect(args.email).toBe('unit@test.local'); // нормализация email
    expect(args.passwordHash).not.toBe('password123');
    expect(args.passwordHash).toMatch(/^\$2[aby]\$/);

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(tokens.issueRefreshToken).toHaveBeenCalledWith(storedUser.id);
  });

  it('login: успех при верном пароле', async () => {
    users.findByEmail.mockResolvedValue(storedUser);
    const result = await authService.login({ email: 'unit@test.local', password: 'password123' });
    expect(result.user).toEqual({ id: 'user-id', email: 'unit@test.local', role: 'user' });
  });

  it('login: UnauthorizedError при неверном пароле и при отсутствии пользователя', async () => {
    users.findByEmail.mockResolvedValue(storedUser);
    await expect(
      authService.login({ email: 'unit@test.local', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedError);

    users.findByEmail.mockResolvedValue(null);
    await expect(
      authService.login({ email: 'ghost@test.local', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
