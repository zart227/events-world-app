import type { ArticleDto, CreateArticleDto } from '../dto/article.dto.js';
import { NotFoundError } from '../errors/app-error.js';
import { articleRepository } from '../repositories/article.repository.js';

export const articleService = {
  async create(data: CreateArticleDto): Promise<ArticleDto> {
    return articleRepository.create(data);
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

  async deleteById(id: string): Promise<void> {
    const deleted = await articleRepository.deleteById(id);
    if (deleted === 0) {
      throw new NotFoundError('Статья не найдена');
    }
  },

  async deleteAll(): Promise<void> {
    const deleted = await articleRepository.deleteAll();
    if (deleted === 0) {
      throw new NotFoundError('Нечего удалять');
    }
  },
};

export type ArticleService = typeof articleService;
