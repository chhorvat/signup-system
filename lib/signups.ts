import { getDb } from '@/db';
import { generateCancelToken } from './tokens';
import { sendConfirmationEmail, sendWaitlistEmail, sendPromotionEmail } from './email';

export interface Signup {
  id: number;
  game_day_id: number;
  name: string;
  email: string;
  cancel_token: string;
  status: 'confirmed' | 'waitlist';
  waitlist_pos: number | null;
  signed_up_at: string;
  notified_at: string | null;
  attended: number | null; // null=unrecorded, 1=attended, 0=no-show
}

export interface SignupsForDay {
  confirmed: Signup[];
  waitlist: Signup[];
}

export function getSignupsForDay(gameDayId: number): SignupsForDay {
  const db = getDb();
  const confirmed = db.prepare(
    "SELECT * FROM signups WHERE game_day_id = ? AND status = 'confirmed' ORDER BY signed_up_at ASC"
  ).all(gameDayId) as Signup[];
  const waitlist = db.prepare(
    "SELECT * FROM signups WHERE game_day_id = ? AND status = 'waitlist' ORDER BY waitlist_pos ASC"
  ).all(gameDayId) as Signup[];
  return { confirmed, waitlist };
}

export function getSignupByToken(token: string): Signup | null {
  const db = getDb();
  return db.prepare('SELECT * FROM signups WHERE cancel_token = ?').get(token) as Signup | null;
}

export function getSignupById(id: number): Signup | null {
  const db = getDb();
  return db.prepare('SELECT * FROM signups WHERE id = ?').get(id) as Signup | null;
}

export type CreateSignupResult =
  | { success: true; status: 'confirmed'; signup: Signup }
  | { success: true; status: 'waitlist'; position: number; signup: Signup }
  | { success: false; error: string };

export function createSignup(
  gameDayId: number,
  name: string,
  email: string,
  gameDate: string,
  gameTime: string,
  gameLocation: string,
  playerCap: number
): CreateSignupResult {
  const db = getDb();

  const doCreate = db.transaction((): CreateSignupResult => {
    // Check for duplicate email on this game day
    const existing = db.prepare(
      'SELECT id FROM signups WHERE game_day_id = ? AND email = ? COLLATE NOCASE'
    ).get(gameDayId, email);
    if (existing) {
      return { success: false, error: 'This email is already signed up for this game.' };
    }

    // Count current confirmed signups
    const row = db.prepare(
      "SELECT COUNT(*) as cnt FROM signups WHERE game_day_id = ? AND status = 'confirmed'"
    ).get(gameDayId) as { cnt: number };

    const token = generateCancelToken();
    const isConfirmed = row.cnt < playerCap;

    if (isConfirmed) {
      db.prepare(`
        INSERT INTO signups (game_day_id, name, email, cancel_token, status)
        VALUES (?, ?, ?, ?, 'confirmed')
      `).run(gameDayId, name, email, token);
    } else {
      // Get next waitlist position
      const posRow = db.prepare(
        "SELECT COALESCE(MAX(waitlist_pos), 0) + 1 AS next_pos FROM signups WHERE game_day_id = ? AND status = 'waitlist'"
      ).get(gameDayId) as { next_pos: number };

      db.prepare(`
        INSERT INTO signups (game_day_id, name, email, cancel_token, status, waitlist_pos)
        VALUES (?, ?, ?, ?, 'waitlist', ?)
      `).run(gameDayId, name, email, token, posRow.next_pos);
    }

    const signup = db.prepare('SELECT * FROM signups WHERE cancel_token = ?').get(token) as Signup;

    if (isConfirmed) {
      return { success: true, status: 'confirmed', signup };
    } else {
      return { success: true, status: 'waitlist', position: signup.waitlist_pos!, signup };
    }
  })();

  // Send email outside the transaction (failure is non-fatal)
  if (doCreate.success) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const cancelUrl = `${appUrl}/cancel/${doCreate.signup.cancel_token}`;
    try {
      if (doCreate.status === 'confirmed') {
        sendConfirmationEmail(email, name, gameDate, gameTime, gameLocation, cancelUrl).catch(console.error);
      } else {
        sendWaitlistEmail(email, name, gameDate, gameTime, gameLocation, doCreate.position, cancelUrl).catch(console.error);
      }
    } catch {
      // email errors are non-fatal
    }
  }

  return doCreate;
}

export type CancelResult =
  | { success: true; wasConfirmed: boolean; promoted: Signup | null }
  | { success: false; error: string };

export function cancelSignup(token: string): CancelResult {
  const db = getDb();

  let promotedSignup: Signup | null = null;
  let wasConfirmed = false;
  let gameDayId: number;

  const doCancel = db.transaction((): CancelResult => {
    const signup = db.prepare('SELECT * FROM signups WHERE cancel_token = ?').get(token) as Signup | null;
    if (!signup) {
      return { success: false, error: 'Signup not found or already cancelled.' };
    }

    gameDayId = signup.game_day_id;
    wasConfirmed = signup.status === 'confirmed';

    // Log the cancellation for accountability tracking
    const gameDay = db.prepare('SELECT date, time FROM game_days WHERE id = ?').get(gameDayId) as { date: string; time: string } | null;
    if (gameDay) {
      const now = new Date();
      const [h, m] = gameDay.time.split(':').map(Number);
      const [y, mo, d] = gameDay.date.split('-').map(Number);
      const gameDateTime = new Date(y, mo - 1, d, h, m, 0);
      const hoursBefore = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const signupDate = new Date(signup.signed_up_at + (signup.signed_up_at.endsWith('Z') ? '' : 'Z'));
      const signupToCancelMinutes = (now.getTime() - signupDate.getTime()) / (1000 * 60);

      db.prepare(`
        INSERT INTO cancellation_log (game_day_id, player_email, player_name, game_date, game_time, hours_before, was_confirmed, signup_to_cancel_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(gameDayId, signup.email, signup.name, gameDay.date, gameDay.time, hoursBefore, wasConfirmed ? 1 : 0, signupToCancelMinutes);
    }

    db.prepare('DELETE FROM signups WHERE cancel_token = ?').run(token);

    if (wasConfirmed) {
      // Promote the first person on the waitlist
      const next = db.prepare(
        "SELECT * FROM signups WHERE game_day_id = ? AND status = 'waitlist' ORDER BY waitlist_pos ASC LIMIT 1"
      ).get(gameDayId) as Signup | null;

      if (next) {
        db.prepare(`
          UPDATE signups
          SET status = 'confirmed', waitlist_pos = NULL, notified_at = datetime('now')
          WHERE id = ?
        `).run(next.id);

        // Shift remaining waitlist positions down by 1
        db.prepare(`
          UPDATE signups
          SET waitlist_pos = waitlist_pos - 1
          WHERE game_day_id = ? AND status = 'waitlist' AND waitlist_pos > 1
        `).run(gameDayId);

        promotedSignup = db.prepare('SELECT * FROM signups WHERE id = ?').get(next.id) as Signup;
      }
    } else {
      // Just shift down remaining waitlist positions
      db.prepare(`
        UPDATE signups
        SET waitlist_pos = waitlist_pos - 1
        WHERE game_day_id = ? AND status = 'waitlist' AND waitlist_pos > ?
      `).run(gameDayId, signup.waitlist_pos ?? 0);
    }

    return { success: true, wasConfirmed, promoted: promotedSignup };
  })();

  // Send promotion email outside the transaction
  if (doCancel.success && doCancel.promoted) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const cancelUrl = `${appUrl}/cancel/${doCancel.promoted.cancel_token}`;
    const gameDay = db.prepare('SELECT * FROM game_days WHERE id = ?').get(gameDayId!) as {
      date: string; time: string; location: string;
    } | null;
    if (gameDay) {
      sendPromotionEmail(
        doCancel.promoted.email,
        doCancel.promoted.name,
        gameDay.date,
        gameDay.time,
        gameDay.location,
        cancelUrl
      ).catch(console.error);
    }
  }

  return doCancel;
}

export function adminRemoveSignup(signupId: number): CancelResult {
  const signup = getSignupById(signupId);
  if (!signup) return { success: false, error: 'Signup not found.' };
  return cancelSignup(signup.cancel_token);
}

export function markAttendance(signupId: number, attended: boolean | null): boolean {
  const db = getDb();
  const val = attended === null ? null : attended ? 1 : 0;
  const result = db.prepare('UPDATE signups SET attended = ? WHERE id = ?').run(val, signupId);
  return result.changes > 0;
}
