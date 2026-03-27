import { getDb } from '@/db';

export interface GameDay {
  id: number;
  date: string;
  time: string;
  location: string;
  notes: string | null;
  player_cap: number;
  created_at: string;
}

export interface GameDayWithCounts extends GameDay {
  confirmed_count: number;
  waitlist_count: number;
}

export function listGameDays(): GameDayWithCounts[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      g.*,
      COUNT(CASE WHEN s.status = 'confirmed' THEN 1 END) AS confirmed_count,
      COUNT(CASE WHEN s.status = 'waitlist'  THEN 1 END) AS waitlist_count
    FROM game_days g
    LEFT JOIN signups s ON s.game_day_id = g.id
    GROUP BY g.id
    ORDER BY g.date ASC
  `).all() as GameDayWithCounts[];
}

export function getGameDay(date: string): GameDayWithCounts | null {
  const db = getDb();
  return db.prepare(`
    SELECT
      g.*,
      COUNT(CASE WHEN s.status = 'confirmed' THEN 1 END) AS confirmed_count,
      COUNT(CASE WHEN s.status = 'waitlist'  THEN 1 END) AS waitlist_count
    FROM game_days g
    LEFT JOIN signups s ON s.game_day_id = g.id
    WHERE g.date = ?
    GROUP BY g.id
  `).get(date) as GameDayWithCounts | null;
}

export function getGameDayById(id: number): GameDay | null {
  const db = getDb();
  return db.prepare('SELECT * FROM game_days WHERE id = ?').get(id) as GameDay | null;
}

export function createGameDay(data: {
  date: string;
  time: string;
  location: string;
  notes?: string;
  player_cap?: number;
}): GameDay {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO game_days (date, time, location, notes, player_cap)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    data.date,
    data.time,
    data.location,
    data.notes ?? null,
    data.player_cap ?? 12
  );
  return db.prepare('SELECT * FROM game_days WHERE id = ?').get(result.lastInsertRowid) as GameDay;
}

export function updateGameDay(id: number, data: {
  date?: string;
  time?: string;
  location?: string;
  notes?: string | null;
  player_cap?: number;
}): GameDay | null {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
  if (data.time !== undefined) { fields.push('time = ?'); values.push(data.time); }
  if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
  if ('notes' in data) { fields.push('notes = ?'); values.push(data.notes ?? null); }
  if (data.player_cap !== undefined) { fields.push('player_cap = ?'); values.push(data.player_cap); }

  if (fields.length === 0) return getGameDayById(id);

  values.push(id);
  db.prepare(`UPDATE game_days SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getGameDayById(id);
}

export function deleteGameDay(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM game_days WHERE id = ?').run(id);
}
