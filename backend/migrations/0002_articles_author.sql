-- Авторство статей для ролевой модели (удаление чужих статей — только admin)

ALTER TABLE articles
    ADD COLUMN author_id uuid REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_articles_author_id ON articles (author_id);
