-- Подписки пользователей на города (для фоновой задачи и WebSocket-уведомлений)

CREATE TABLE city_subscriptions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    city       text NOT NULL,
    address    text NOT NULL,
    latitude   numeric(9, 6) NOT NULL,
    longitude  numeric(9, 6) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, city)
);

CREATE INDEX idx_city_subscriptions_user_id ON city_subscriptions (user_id);
CREATE INDEX idx_city_subscriptions_city ON city_subscriptions (city);
