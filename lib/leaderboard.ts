import { getDb } from '@/db';

export interface LeaderboardPlayer {
  name: string;
  email: string;
  total_signups: number;       // all confirmed historical (attended + no-show + cancelled)
  games_tracked: number;       // past games where attendance was marked
  games_attended: number;
  attendance_rate: number | null;  // percent (0-100)
  total_cancels: number;
  day_of_cancels: number;
  day_of_rate: number | null;      // percent (0-100)
}

const GRACE = 10;   // minutes
const DOH   = 24;   // hours — "day of" threshold

export function getLeaderboardStats(): LeaderboardPlayer[] {
  const db = getDb();

  // Past-game attendance (only games that already happened with attendance marked)
  const attendRows = db.prepare(`
    SELECT s.email, s.name,
      SUM(CASE WHEN s.attended = 1 THEN 1 ELSE 0 END) AS games_attended,
      COUNT(*) AS games_tracked
    FROM signups s
    JOIN game_days gd ON gd.id = s.game_day_id
    WHERE s.status = 'confirmed'
      AND s.attended IS NOT NULL
      AND gd.date < date('now')
    GROUP BY s.email
  `).all() as { email: string; name: string; games_attended: number; games_tracked: number }[];

  // Total confirmed historical signups (attended/no-show rows)
  const confirmedRows = db.prepare(`
    SELECT s.email, COUNT(*) AS cnt
    FROM signups s
    JOIN game_days gd ON gd.id = s.game_day_id
    WHERE s.status = 'confirmed' AND gd.date < date('now')
    GROUP BY s.email
  `).all() as { email: string; cnt: number }[];

  // Cancellation history
  const cancelRows = db.prepare(`
    SELECT player_email AS email, player_name AS name,
      COUNT(*) AS total_cancels,
      SUM(CASE
        WHEN was_confirmed = 1
          AND hours_before <= ? AND hours_before > -48
          AND (signup_to_cancel_minutes IS NULL OR signup_to_cancel_minutes > ?)
        THEN 1 ELSE 0 END) AS day_of_cancels
    FROM cancellation_log
    WHERE was_confirmed = 1
    GROUP BY player_email
  `).all(DOH, GRACE) as { email: string; name: string; total_cancels: number; day_of_cancels: number }[];

  // Cancellation totals for total_signups count
  const cancelCountRows = db.prepare(`
    SELECT player_email AS email, COUNT(*) AS cnt
    FROM cancellation_log WHERE was_confirmed = 1
    GROUP BY player_email
  `).all() as { email: string; cnt: number }[];

  const map = new Map<string, LeaderboardPlayer>();

  function get(email: string, name: string): LeaderboardPlayer {
    const key = email.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { email: key, name, total_signups: 0, games_tracked: 0, games_attended: 0, attendance_rate: null, total_cancels: 0, day_of_cancels: 0, day_of_rate: null });
    }
    return map.get(key)!;
  }

  for (const r of attendRows) {
    const p = get(r.email, r.name);
    p.games_attended = r.games_attended;
    p.games_tracked  = r.games_tracked;
  }
  for (const r of confirmedRows) {
    const p = get(r.email, r.email);
    p.total_signups += r.cnt;
  }
  for (const r of cancelRows) {
    const p = get(r.email, r.name);
    p.total_cancels  = r.total_cancels;
    p.day_of_cancels = r.day_of_cancels;
  }
  for (const r of cancelCountRows) {
    const p = get(r.email, r.email);
    p.total_signups += r.cnt;
  }

  // Compute rates
  for (const p of map.values()) {
    if (p.games_tracked > 0) {
      p.attendance_rate = Math.round((p.games_attended / p.games_tracked) * 100);
    }
    if (p.total_cancels > 0) {
      p.day_of_rate = Math.round((p.day_of_cancels / p.total_cancels) * 100);
    }
    // Prefer the name from attendance/cancel rows over email
  }

  return Array.from(map.values()).filter(p => p.games_tracked >= 3 || p.total_cancels >= 2);
}
