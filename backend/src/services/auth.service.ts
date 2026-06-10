import bcrypt from 'bcrypt';
import { config } from '../config/env.js';
import type { CredentialsDto, UserDto } from '../dto/auth.dto.js';
import { ConflictError, UnauthorizedError } from '../errors/app-error.js';
import { userRepository } from '../repositories/user.repository.js';
import { tokenService, type AuthUser } from './token.service.js';

const BCRYPT_ROUNDS = 12;

export interface AuthResult {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

function toUserDto(user: AuthUser): UserDto {
  return { id: user.id, email: user.email, role: user.role };
}

async function issueTokens(user: AuthUser): Promise<AuthResult> {
  const accessToken = tokenService.signAccessToken(user);
  const refreshToken = await tokenService.issueRefreshToken(user.id);
  return { user: toUserDto(user), accessToken, refreshToken };
}

export const authService = {
  async register(credentials: CredentialsDto): Promise<AuthResult> {
    const email = credentials.email.toLowerCase();
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Пользователь с таким email уже существует');
    }
    const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_ROUNDS);
    const role = config.auth.adminEmails.includes(email) ? 'admin' : 'user';
    const user = await userRepository.createWithSettings({ email, passwordHash, role });
    return issueTokens({ id: user.id, email: user.email, role: user.role });
  },

  async login(credentials: CredentialsDto): Promise<AuthResult> {
    const user = await userRepository.findByEmail(credentials.email.toLowerCase());
    const passwordOk = user && (await bcrypt.compare(credentials.password, user.password_hash));
    if (!passwordOk) {
      throw new UnauthorizedError('Неверный email или пароль');
    }
    return issueTokens({ id: user.id, email: user.email, role: user.role });
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    const rotated = await tokenService.rotateRefreshToken(refreshToken);
    const user = await userRepository.findById(rotated.userId);
    if (!user) {
      throw new UnauthorizedError('Пользователь не найден');
    }
    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
    return {
      user: toUserDto(authUser),
      accessToken: tokenService.signAccessToken(authUser),
      refreshToken: rotated.refreshToken,
    };
  },

  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  },

  async logoutAll(userId: string): Promise<number> {
    return tokenService.revokeAllSessions(userId);
  },
};

export type AuthService = typeof authService;
