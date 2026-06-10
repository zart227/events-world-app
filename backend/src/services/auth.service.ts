import type { CredentialsDto, UserDto } from '../dto/auth.dto.js';
import { ConflictError, UnauthorizedError } from '../errors/app-error.js';
import { userRepository } from '../repositories/user.repository.js';

export const authService = {
  async register(credentials: CredentialsDto): Promise<UserDto> {
    const existing = await userRepository.findByEmail(credentials.email);
    if (existing) {
      throw new ConflictError('Пользователь с таким email уже существует');
    }
    // TODO(block 3): хэширование пароля через bcrypt
    const user = await userRepository.createWithSettings({
      email: credentials.email,
      passwordHash: credentials.password,
    });
    return { id: user.id, email: user.email };
  },

  async login(credentials: CredentialsDto): Promise<UserDto> {
    const user = await userRepository.findByEmail(credentials.email);
    if (!user || user.password_hash !== credentials.password) {
      throw new UnauthorizedError('Неверный email или пароль');
    }
    return { id: user.id, email: user.email };
  },
};

export type AuthService = typeof authService;
