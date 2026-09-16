CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(24) NOT NULL,
    reaction_ms INTEGER NOT NULL CHECK (reaction_ms > 0 AND reaction_ms <= 10000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scores_reaction_ms_idx ON scores (reaction_ms);
CREATE INDEX IF NOT EXISTS scores_created_at_idx ON scores (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS scores_nickname_lower_uidx
    ON scores (LOWER(nickname));
