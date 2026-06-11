import { prisma } from '../db/prisma.js';
import type {
  ArticleDto,
  ArticlesPageDto,
  CreateArticleDto,
  ListArticlesQueryDto,
} from '../dto/article.dto.js';
import { Prisma } from '../generated/prisma/client.js';

interface ArticleRow {
  id: string;
  title: string;
  short_desc: string | null;
  description: string;
  author_id: string | null;
  created_at: Date;
}

interface ArticleRowWithTotal extends ArticleRow {
  total: bigint;
}

function toDto(row: ArticleRow): ArticleDto {
  return {
    id: row.id,
    title: row.title,
    short_desc: row.short_desc ?? undefined,
    description: row.description,
    author_id: row.author_id,
    created_at: row.created_at.toISOString(),
  };
}

function toRow(article: {
  id: string;
  title: string;
  shortDesc: string | null;
  description: string;
  authorId: string | null;
  createdAt: Date;
}): ArticleRow {
  return {
    id: article.id,
    title: article.title,
    short_desc: article.shortDesc,
    description: article.description,
    author_id: article.authorId,
    created_at: article.createdAt,
  };
}

export const articleRepository = {
  async create(data: CreateArticleDto, authorId: string): Promise<ArticleDto> {
    const article = await prisma.article.create({
      data: {
        title: data.title,
        shortDesc: data.short_desc ?? null,
        description: data.description,
        authorId,
      },
    });
    return toDto(toRow(article));
  },

  async findAll(): Promise<ArticleDto[]> {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return articles.map((article) => toDto(toRow(article)));
  },

  /** Пагинация + сортировка + полнотекстовый поиск (tsvector). */
  async findPage(query: ListArticlesQueryDto): Promise<ArticlesPageDto> {
    const sortMap: Record<ListArticlesQueryDto['sort'], string> = {
      'created_at:desc': 'created_at DESC',
      'created_at:asc': 'created_at ASC',
      'title:asc': 'title ASC',
      'title:desc': 'title DESC',
    };
    const orderBy = sortMap[query.sort];
    const offset = (query.page - 1) * query.limit;
    const search = query.q ?? null;

    const rows = await prisma.$queryRaw<ArticleRowWithTotal[]>`
      SELECT id, title, short_desc, description, author_id, created_at,
             count(*) OVER () AS total
      FROM articles
      WHERE ${search === null ? Prisma.sql`true` : Prisma.sql`search_vector @@ websearch_to_tsquery('russian', ${search})`}
      ORDER BY ${Prisma.raw(orderBy)}
      LIMIT ${query.limit} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? Number(rows[0]!.total) : await this.countSearch(search);
    return {
      items: rows.map(toDto),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  async countSearch(search: string | null): Promise<number> {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) AS count
      FROM articles
      WHERE ${search === null ? Prisma.sql`true` : Prisma.sql`search_vector @@ websearch_to_tsquery('russian', ${search})`}
    `;
    return Number(rows[0]?.count ?? 0);
  },

  async findById(id: string): Promise<ArticleDto | null> {
    const article = await prisma.article.findUnique({ where: { id } });
    return article ? toDto(toRow(article)) : null;
  },

  async deleteById(id: string): Promise<number> {
    const result = await prisma.article.deleteMany({ where: { id } });
    return result.count;
  },

  async deleteAll(): Promise<number> {
    const result = await prisma.article.deleteMany();
    return result.count;
  },
};

export type ArticleRepository = typeof articleRepository;
