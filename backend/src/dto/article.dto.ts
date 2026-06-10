import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(1, 'Необходимо указать заголовок статьи'),
  short_desc: z.string().optional(),
  description: z.string().min(1, 'Необходимо указать описание статьи'),
});

export const articleIdSchema = z.object({
  id: z.uuid('Некорректный идентификатор статьи'),
});

export type CreateArticleDto = z.infer<typeof createArticleSchema>;

export interface ArticleDto {
  id: string;
  title: string;
  short_desc?: string | undefined;
  description: string;
  author_id: string | null;
  created_at: string;
}
