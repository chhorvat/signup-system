import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

function tok(): string {
  return randomBytes(16).toString('hex');
}

function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

interface PlayerProfile {
  name: string;
  email: string;
  freq: number;      // probability of appearing in a given game
  attend: number;    // probability of attending when signed up
  dayCancel: number; // fraction of cancellations that are day-of
}

const PLAYERS: PlayerProfile[] = [
  { name: 'Matt Phipps',      email: 'matt.phipps@jcc.com',      freq: 0.92, attend: 0.92, dayCancel: 0.03 },
  { name: 'James Andriotis',  email: 'james.andriotis@jcc.com',  freq: 0.88, attend: 0.96, dayCancel: 0.00 },
  { name: 'Jake Heffern',     email: 'jake.heffern@jcc.com',     freq: 0.88, attend: 0.91, dayCancel: 0.02 },
  { name: 'Ramu Kharel',      email: 'ramu.kharel@jcc.com',      freq: 0.84, attend: 0.89, dayCancel: 0.05 },
  { name: 'Sam Mendes',       email: 'sam.mendes@jcc.com',       freq: 0.82, attend: 0.87, dayCancel: 0.00 },
  { name: 'Lee Harris',       email: 'lee.harris@jcc.com',       freq: 0.76, attend: 0.85, dayCancel: 0.08 },
  { name: 'Andy Chatham',     email: 'andy.chatham@jcc.com',     freq: 0.72, attend: 0.84, dayCancel: 0.05 },
  { name: 'Kevin Cabrera',    email: 'kevin.cabrera@jcc.com',    freq: 0.72, attend: 0.82, dayCancel: 0.03 },
  { name: 'Will Otto',        email: 'will.otto@jcc.com',        freq: 0.67, attend: 0.80, dayCancel: 0.10 },
  { name: 'Andrew Wingerter', email: 'andrew.wingerter@jcc.com', freq: 0.67, attend: 0.78, dayCancel: 0.05 },
  { name: 'Connor G',         email: 'connor.g@jcc.com',         freq: 0.62, attend: 0.72, dayCancel: 0.15 },
  { name: 'Geoff Decker',     email: 'geoff.decker@jcc.com',     freq: 0.62, attend: 0.70, dayCancel: 0.10 },
  { name: 'Kenny Z',          email: 'kenny.z@jcc.com',          freq: 0.57, attend: 0.68, dayCancel: 0.20 },
  { name: 'Manish Shrestha',  email: 'manish.shrestha@jcc.com',  freq: 0.62, attend: 0.65, dayCancel: 0.15 },
  { name: 'Eugene McGrane',   email: 'eugene.mcgrane@jcc.com',   freq: 0.52, attend: 0.63, dayCancel: 0.20 },
  { name: 'Robert Zotti',     email: 'robert.zotti@jcc.com',     freq: 0.57, attend: 0.60, dayCancel: 0.18 },
  { name: 'Kham',             email: 'kham@jcc.com',             freq: 0.52, attend: 0.58, dayCancel: 0.22 },
  { name: 'Kevin Pleasants',  email: 'kevin.pleasants@jcc.com',  freq: 0.48, attend: 0.45, dayCancel: 0.40 },
  { name: 'Will G',           email: 'will.g@jcc.com',           freq: 0.47, attend: 0.48, dayCancel: 0.35 },
  { name: 'Mike Johnson',     email: 'mike.johnson@jcc.com',     freq: 0.42, attend: 0.50, dayCancel: 0.28 },
  { name: 'David Kim',        email: 'david.kim@jcc.com',        freq: 0.42, attend: 0.45, dayCancel: 0.30 },
  { name: 'Ed Pisano',        email: 'ed.pisano@jcc.com',        freq: 0.42, attend: 0.40, dayCancel: 0.50 },
  { name: 'Tom Bradley',      email: 'tom.bradley@jcc.com',      freq: 0.37, attend: 0.55, dayCancel: 0.15 },
  { name: 'Carlos Rivera',    email: 'carlos.rivera@jcc.com',    freq: 0.37, attend: 0.60, dayCancel: 0.10 },
];

const PLAYER_MAP = new Map(PLAYERS.map(p => [p.name, p]));

// Specific lineups from screenshots (current week Mon/Tue)
const MONDAY_LINEUP = [
  'Matt Phipps','Kenny Z','Ramu Kharel','Ed Pisano','Robert Zotti','Sam Mendes',
  'Manish Shrestha','Lee Harris','Andrew Wingerter','James Andriotis','Geoff Decker','Jake Heffern',
];
const TUESDAY_LINEUP = [
  'James Andriotis','Will Otto','Connor G','Matt Phipps','Andy Chatham','Kham',
  'Ramu Kharel','Kevin Cabrera','Jake Heffern','Will G','Sam Mendes','Eugene McGrane',
];

const PAST_MONDAYS = [
  '2026-03-23','2026-03-16','2026-03-09','2026-03-02',
  '2026-02-23','2026-02-16','2026-02-09','2026-02-02',
];
const CURRENT_WEEK = ['2026-03-30','2026-03-31','2026-04-01','2026-04-02','2026-04-03'];

function pickPlayers(rng: () => number): PlayerProfile[] {
  const scored = PLAYERS.map(p => ({ p, score: rng() * 0.45 + p.freq * 0.55 }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 12).map(x => x.p);
}

export function seedIfEmpty(db: Database.Database): void {
  const { cnt } = db.prepare('SELECT COUNT(*) as cnt FROM game_days').get() as { cnt: number };
  if (cnt > 0) return;

  const insertGame = db.prepare(
    'INSERT INTO game_days (date, time, location, notes, player_cap) VALUES (?, ?, ?, ?, ?)'
  );
  const insertSignup = db.prepare(`
    INSERT INTO signups (game_day_id, name, email, cancel_token, status, waitlist_pos, signed_up_at, attended)
    VALUES (?, ?, ?, ?, 'confirmed', NULL, ?, ?)
  `);
  const insertCancel = db.prepare(`
    INSERT INTO cancellation_log
      (game_day_id, player_email, player_name, game_date, game_time, cancelled_at, hours_before, was_confirmed, signup_to_cancel_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const rng = makePrng(31337);

  db.transaction(() => {
    // --- Past 8 weeks (40 games) ---
    for (const monday of PAST_MONDAYS) {
      for (let offset = 0; offset < 5; offset++) {
        const date = addDays(monday, offset);
        const { lastInsertRowid: gameId } = insertGame.run(date, '12:00', 'JCC Main Gym', null, 12);
        const signupAt = addDays(date, -5) + 'T09:00:00';
        const gamePlayers = pickPlayers(rng);

        for (const player of gamePlayers) {
          const attended = rng() < player.attend;
          const didCancel = !attended && rng() < 0.45;

          if (didCancel) {
            const isDayOf = rng() < player.dayCancel;
            const hoursBefore = isDayOf ? 1 + rng() * 20 : 26 + rng() * 46;
            const gameTs = new Date(`${date}T12:00:00Z`).getTime();
            const cancelTs = gameTs - hoursBefore * 3_600_000;
            const cancelledAt = new Date(cancelTs).toISOString().replace('T', ' ').slice(0, 19);
            const signupToCancel = (cancelTs - new Date(signupAt + 'Z').getTime()) / 60_000;
            insertCancel.run(gameId, player.email, player.name, date, '12:00', cancelledAt, hoursBefore, Math.max(signupToCancel, 15));
          } else {
            insertSignup.run(gameId, player.name, player.email, tok(), signupAt, attended ? 1 : 0);
          }
        }
      }
    }

    // --- Current week (5 games, upcoming) ---
    for (let i = 0; i < CURRENT_WEEK.length; i++) {
      const date = CURRENT_WEEK[i];
      const { lastInsertRowid: gameId } = insertGame.run(date, '12:00', 'JCC Main Gym', null, 12);
      const signupAt = date + 'T07:30:00';

      let lineup: string[];
      if (i === 0) lineup = MONDAY_LINEUP;
      else if (i === 1) lineup = TUESDAY_LINEUP;
      else {
        const shuffled = pickPlayers(rng);
        lineup = shuffled.map(p => p.name);
      }

      for (const name of lineup) {
        const player = PLAYER_MAP.get(name);
        if (!player) continue;
        insertSignup.run(gameId, player.name, player.email, tok(), signupAt, null);
      }
    }
  })();
}
