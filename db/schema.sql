CREATE TABLE IF NOT EXISTS game_days (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL UNIQUE,
  time        TEXT NOT NULL DEFAULT '18:00',
  location    TEXT NOT NULL DEFAULT 'Main Gym',
  notes       TEXT,
  player_cap  INTEGER NOT NULL DEFAULT 12,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS signups (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  game_day_id    INTEGER NOT NULL REFERENCES game_days(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  cancel_token   TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'confirmed',
  waitlist_pos   INTEGER,
  signed_up_at   TEXT NOT NULL DEFAULT (datetime('now')),
  notified_at    TEXT
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token       TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signups_game_day ON signups(game_day_id);
CREATE INDEX IF NOT EXISTS idx_signups_token    ON signups(cancel_token);
CREATE INDEX IF NOT EXISTS idx_signups_status   ON signups(game_day_id, status);
