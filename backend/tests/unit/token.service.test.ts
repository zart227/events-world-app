import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../src/errors/app-error.js';
import { tokenService } from '../../src/services/token.service.js';

const user = { id: '7d9a1b5e-0000-4000-8000-000000000001', email: 'unit@test.local', role: 'user' as const };

describe('tokenService (unit)', () => {
  it('подписывает и верифицирует access-токен', () => {
    const token = tokenService.signAccessToken(user);
    const decoded = tokenService.verifyAccessToken(token);
    expect(decoded).toEqual(user);
  });

  it('отклоняет повреждённый токен', () => {
    expect(() => tokenService.verifyAccessToken('broken.token.value')).toThrow(UnauthorizedError);
  });

  it('отклоняет токен с чужой подписью', () => {
    const forged =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: 'admin' })).toString(
        'base64url',
      ) +
      '.invalid-signature';
    expect(() => tokenService.verifyAccessToken(forged)).toThrow(UnauthorizedError);
  });
});
