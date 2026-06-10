import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../src/errors/app-error.js';
import { articleRepository } from '../../src/repositories/article.repository.js';
import { articleService } from '../../src/services/article.service.js';

vi.mock('../../src/repositories/article.repository.js', () => ({
  articleRepository: {
    create: vi.fn(),
    findPage: vi.fn(),
    findById: vi.fn(),
    deleteById: vi.fn(),
    deleteAll: vi.fn(),
  },
}));

const repo = vi.mocked(articleRepository);

const owner = { id: 'owner-id', email: 'owner@test.local', role: 'user' as const };
const stranger = { id: 'stranger-id', email: 'other@test.local', role: 'user' as const };
const admin = { id: 'admin-id', email: 'admin@test.local', role: 'admin' as const };

const article = {
  id: 'article-id',
  title: 'T',
  description: 'D',
  author_id: owner.id,
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('articleService (unit)', () => {
  it('create передаёт авторство в репозиторий', async () => {
    repo.create.mockResolvedValue(article);
    await articleService.create({ title: 'T', description: 'D' }, owner);
    expect(repo.create).toHaveBeenCalledWith({ title: 'T', description: 'D' }, owner.id);
  });

  it('getById бросает NotFoundError для отсутствующей статьи', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(articleService.getById('missing')).rejects.toThrow(NotFoundError);
  });

  it('deleteById: автор может удалить свою статью', async () => {
    repo.findById.mockResolvedValue(article);
    repo.deleteById.mockResolvedValue(1);
    await articleService.deleteById(article.id, owner);
    expect(repo.deleteById).toHaveBeenCalledWith(article.id);
  });

  it('deleteById: чужая статья запрещена для user', async () => {
    repo.findById.mockResolvedValue(article);
    await expect(articleService.deleteById(article.id, stranger)).rejects.toThrow(ForbiddenError);
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('deleteById: admin может удалить чужую статью', async () => {
    repo.findById.mockResolvedValue(article);
    repo.deleteById.mockResolvedValue(1);
    await articleService.deleteById(article.id, admin);
    expect(repo.deleteById).toHaveBeenCalledWith(article.id);
  });

  it('deleteAll бросает NotFoundError, когда удалять нечего', async () => {
    repo.deleteAll.mockResolvedValue(0);
    await expect(articleService.deleteAll()).rejects.toThrow(NotFoundError);
  });
});
