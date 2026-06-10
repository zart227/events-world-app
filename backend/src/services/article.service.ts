import type { ArticleDto, CreateArticleDto } from '../dto/article.dto.js';
import { ForbiddenError, NotFoundError } from '../errors/app-error.js';
import { articleRepository } from '../repositories/article.repository.js';
import type { AuthUser } from './token.service.js';

export const articleService = {
  async create(data: CreateArticleDto, author: AuthUser): Promise<ArticleDto> {
    return articleRepository.create(data, author.id);
  },

  async getAll(): Promise<ArticleDto[]> {
    return articleRepository.findAll();
  },

  async getById(id: string): Promise<ArticleDto> {
    const article = await articleRepository.findById(id);
    if (!article) {
      throw new NotFoundError('Статья не найдена');
    }
    return article;
  },

  async deleteById(id: string, user: AuthUser): Promise<void> {
    const article = await articleRepository.findById(id);
    if (!article) {
      throw new NotFoundError('Статья не найдена');
    }
    // Удалять чужие статьи может только admin
    if (article.author_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('Удалять чужие статьи может только администратор');
    }
    await articleRepository.deleteById(id);
  },

  async deleteAll(): Promise<void> {
    const deleted = await articleRepository.deleteAll();
    if (deleted === 0) {
      throw new NotFoundError('Нечего удалять');
    }
  },
};

export type ArticleService = typeof articleService;
