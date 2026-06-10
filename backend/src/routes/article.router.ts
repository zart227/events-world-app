import { Router } from 'express';
import { articleController } from '../controllers/article.controller.js';
import {
  articleIdSchema,
  createArticleSchema,
  listArticlesQuerySchema,
} from '../dto/article.dto.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

export const articleRouter = Router();

articleRouter.get('/', validate('query', listArticlesQuerySchema), articleController.getPage);
articleRouter.get('/:id', validate('params', articleIdSchema), articleController.getById);
articleRouter.post('/', requireAuth, validate('body', createArticleSchema), articleController.create);
articleRouter.delete(
  '/:id',
  requireAuth,
  validate('params', articleIdSchema),
  articleController.deleteById,
);
articleRouter.delete('/', requireAuth, requireRole('admin'), articleController.deleteAll);
