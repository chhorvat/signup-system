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
  notified_at    TEXT,
  attended       INTEGER         -- NULL=not recorded, 1=attended, 0=no-show
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token       TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL
);

-- Persists cancellation history even after the signup row is deleted
CREATE TABLE IF NOT EXISTS cancellation_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  game_day_id    INTEGER NOT NULL,
  player_email   TEXT NOT NULL,
  player_name    TEXT NOT NULL,
  game_date      TEXT NOT NULL,
  game_time      TEXT NOT NULL,
  cancelled_at   TEXT NOT NULL DEFAULT (datetime('now')),
  hours_before   REAL,           -- hours before game time; negative = already past game time
  was_confirmed  INTEGER NOT NULL DEFAULT 1,  -- 1 = was confirmed, 0 = was on waitlist
  signup_to_cancel_minutes REAL  -- minutes between signing up and cancelling (grace period filter)
);

CREATE INDEX IF NOT EXISTS idx_signups_game_day ON signups(game_day_id);
CREATE INDEX IF NOT EXISTS idx_signups_token    ON signups(cancel_token);
CREATE INDEX IF NOT EXISTS idx_signups_status   ON signups(game_day_id, status);
CREATE INDEX IF NOT EXISTS idx_cancel_log_email ON cancellation_log(player_email);
CREATE INDEX IF NOT EXISTS idx_cancel_log_game  ON cancellation_log(game_day_id);
