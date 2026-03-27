import { getDb } from '@/db';

export interface PlayerStat {
  email: string;
  name: string; // most recent name used
  total_confirmed: number;    // times confirmed (current + historical)
  attended: number;           // times admin marked as attended
  no_shows: number;           // times admin marked as no-show
  attendance_rate: number | null; // attended / (attended + no_shows), null if no data
  total_cancellations: number;
  day_of_cancellations: number;  // cancelled within 24h of game (excluding grace period)
  day_of_rate: number | null;    // day_of / total_cancellations (confirmed only), null if never cancelled
}

// Grace period: cancellations within 10 minutes of signing up are excluded from day-of stats
const GRACE_PERIOD_MINUTES = 10;

// "Day of" = cancelled within 24 hours of game time
const DAY_OF_HOURS = 24;

export function getPlayerStats(): PlayerStat[] {
  const db = getDb();

  // Attendance data from current confirmed signups
  const attendanceRows = db.prepare(`
    SELECT
      email,
      name,
      SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) AS attended,
      SUM(CASE WHEN attended = 0 THEN 1 ELSE 0 END) AS no_shows
    FROM signups
    WHERE status = 'confirmed'
    GROUP BY email
  `).all() as { email: string; name: string; attended: number; no_shows: number }[];

  // Cancellation history
  const cancelRows = db.prepare(`
    SELECT
      player_email AS email,
      player_name  AS name,
      COUNT(*) AS total_cancellations,
      SUM(CASE
        WHEN was_confirmed = 1
          AND hours_before <= ? AND hours_before > -48
          AND (signup_to_cancel_minutes IS NULL OR signup_to_cancel_minutes > ?)
        THEN 1 ELSE 0 END) AS day_of_cancellations,
      SUM(CASE WHEN was_confirmed = 1 THEN 1 ELSE 0 END) AS confirmed_cancellations
    FROM cancellation_log
    GROUP BY player_email
  `).all(DAY_OF_HOURS, GRACE_PERIOD_MINUTES) as {
    email: string; name: string;
    total_cancellations: number;
    day_of_cancellations: number;
    confirmed_cancellations: number;
  }[];

  // Total confirmed slots (current + historical)
  const confirmedCountRows = db.prepare(`
    SELECT email, name, COUNT(*) AS cnt FROM signups WHERE status = 'confirmed' GROUP BY email
  `).all() as { email: string; name: string; cnt: number }[];
  const confirmedCancelCount = db.prepare(`
    SELECT player_email AS email, player_name AS name, COUNT(*) AS cnt FROM cancellation_log WHERE was_confirmed = 1 GROUP BY player_email
  `).all() as { email: string; name: string; cnt: number }[];

  // Build a unified player map
  const playerMap = new Map<string, PlayerStat>();

  function getOrCreate(email: string, name: string): PlayerStat {
    const key = email.toLowerCase();
    if (!playerMap.has(key)) {
      playerMap.set(key, {
        email: key, name,
        total_confirmed: 0, attended: 0, no_shows: 0,
        attendance_rate: null,
        total_cancellations: 0, day_of_cancellations: 0, day_of_rate: null,
      });
    }
    return playerMap.get(key)!;
  }

  for (const r of attendanceRows) {
    const p = getOrCreate(r.email, r.name);
    p.attended = r.attended;
    p.no_shows = r.no_shows;
  }

  for (const r of cancelRows) {
    const p = getOrCreate(r.email, r.name);
    p.total_cancellations = r.total_cancellations;
    p.day_of_cancellations = r.day_of_cancellations;
  }

  for (const r of confirmedCountRows) {
    const p = getOrCreate(r.email, r.name);
    p.total_confirmed += r.cnt;
  }

  for (const r of confirmedCancelCount) {
    const p = getOrCreate(r.email, r.name);
    p.total_confirmed += r.cnt;
  }

  // Compute rates
  for (const p of playerMap.values()) {
    const attended = p.attended + p.no_shows;
    p.attendance_rate = attended > 0 ? Math.round((p.attended / attended) * 100) : null;

    const confirmedCancels = p.total_cancellations; // all logged are confirmed (or we track separately)
    p.day_of_rate = confirmedCancels > 0 ? Math.round((p.day_of_cancellations / confirmedCancels) * 100) : null;
  }

  return Array.from(playerMap.values()).sort((a, b) => b.total_confirmed - a.total_confirmed);
}

export interface GameCancellationSummary {
  game_date: string;
  total_cancellations: number;
  day_of_count: number;
  waitlist_count: number;
}

export function getGameCancellationStats(): GameCancellationSummary[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      game_date,
      COUNT(*) AS total_cancellations,
      SUM(CASE
        WHEN was_confirmed = 1
          AND hours_before <= ? AND hours_before > -48
          AND (signup_to_cancel_minutes IS NULL OR signup_to_cancel_minutes > ?)
        THEN 1 ELSE 0 END) AS day_of_count,
      SUM(CASE WHEN was_confirmed = 0 THEN 1 ELSE 0 END) AS waitlist_count
    FROM cancellation_log
    GROUP BY game_date
    ORDER BY game_date DESC
    LIMIT 30
  `).all(DAY_OF_HOURS, GRACE_PERIOD_MINUTES) as GameCancellationSummary[];
}
