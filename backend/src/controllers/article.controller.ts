import type { Request, Response } from 'express';
import type { CreateArticleDto } from '../dto/article.dto.js';
import { getAuthUser } from '../middlewares/auth.js';
import { getValidated } from '../middlewares/validate.js';
import { articleService } from '../services/article.service.js';

export const articleController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = getValidated<CreateArticleDto>(req, 'body');
    const article = await articleService.create(data, getAuthUser(req));
    res.status(201).json(article);
  },

  async getAll(_req: Request, res: Response): Promise<void> {
    const articles = await articleService.getAll();
    res.status(200).json(articles);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const article = await articleService.getById(id);
    res.status(200).json(article);
  },

  async deleteById(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<{ id: string }>(req, 'params');
    await articleService.deleteById(id, getAuthUser(req));
    res.status(204).send();
  },

  async deleteAll(_req: Request, res: Response): Promise<void> {
    await articleService.deleteAll();
    res.status(204).send();
  },
};
