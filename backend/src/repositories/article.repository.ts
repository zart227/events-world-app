import { pool } from '../db/pool.js';
import type { ArticleDto, CreateArticleDto } from '../dto/article.dto.js';

interface ArticleRow {
  id: string;
  title: string;
  short_desc: string | null;
  description: string;
  created_at: Date;
}

function toDto(row: ArticleRow): ArticleDto {
  return {
    id: row.id,
    title: row.title,
    short_desc: row.short_desc ?? undefined,
    description: row.description,
    created_at: row.created_at.toISOString(),
  };
}

export const articleRepository = {
  async create(data: CreateArticleDto): Promise<ArticleDto> {
    const { rows } = await pool.query<ArticleRow>(
      `INSERT INTO articles (title, short_desc, description)
       VALUES ($1, $2, $3)
       RETURNING id, title, short_desc, description, created_at`,
      [data.title, data.short_desc ?? null, data.description],
    );
    return toDto(rows[0]!);
  },

  async findAll(): Promise<ArticleDto[]> {
    const { rows } = await pool.query<ArticleRow>(
      `SELECT id, title, short_desc, description, created_at
       FROM articles
       ORDER BY created_at DESC`,
    );
    return rows.map(toDto);
  },

  async findById(id: string): Promise<ArticleDto | null> {
    const { rows } = await pool.query<ArticleRow>(
      `SELECT id, title, short_desc, description, created_at
       FROM articles
       WHERE id = $1`,
      [id],
    );
    return rows[0] ? toDto(rows[0]) : null;
  },

  async deleteById(id: string): Promise<number> {
    const result = await pool.query('DELETE FROM articles WHERE id = $1', [id]);
    return result.rowCount ?? 0;
  },

  async deleteAll(): Promise<number> {
    const result = await pool.query('DELETE FROM articles');
    return result.rowCount ?? 0;
  },
};

export type ArticleRepository = typeof articleRepository;
