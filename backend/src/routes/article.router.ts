import { Router } from 'express';
import { articleController } from '../controllers/article.controller.js';
import { articleIdSchema, createArticleSchema } from '../dto/article.dto.js';
import { validate } from '../middlewares/validate.js';

export const articleRouter = Router();

articleRouter.post('/', validate('body', createArticleSchema), articleController.create);
articleRouter.get('/', articleController.getAll);
articleRouter.get('/:id', validate('params', articleIdSchema), articleController.getById);
articleRouter.delete('/:id', validate('params', articleIdSchema), articleController.deleteById);
articleRouter.delete('/', articleController.deleteAll);
