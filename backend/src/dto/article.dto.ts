import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(1, 'Необходимо указать заголовок статьи'),
  short_desc: z.string().optional(),
  description: z.string().min(1, 'Необходимо указать описание статьи'),
});

export const articleIdSchema = z.object({
  id: z.uuid('Некорректный идентификатор статьи'),
});

export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z
    .enum(['created_at:desc', 'created_at:asc', 'title:asc', 'title:desc'])
    .default('created_at:desc'),
  q: z.string().trim().min(1).optional(),
});

export type CreateArticleDto = z.infer<typeof createArticleSchema>;
export type ListArticlesQueryDto = z.infer<typeof listArticlesQuerySchema>;

export interface ArticleDto {
  id: string;
  title: string;
  short_desc?: string | undefined;
  description: string;
  author_id: string | null;
  created_at: string;
}

export interface ArticlesPageDto {
  items: ArticleDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
