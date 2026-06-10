-- Полнотекстовый поиск по статьям (tsvector + GIN)

ALTER TABLE articles
    ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(short_desc, '')), 'B') ||
        setweight(to_tsvector('russian', coalesce(description, '')), 'C')
    ) STORED;

CREATE INDEX idx_articles_search_vector ON articles USING GIN (search_vector);
