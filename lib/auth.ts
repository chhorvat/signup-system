import { getDb } from '@/db';
import { generateSessionToken } from './tokens';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createAdminSession(): string {
  const db = getDb();
  const token = generateSessionToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DURATION_MS);

  db.prepare(`
    INSERT INTO admin_sessions (token, created_at, expires_at)
    VALUES (?, datetime('now'), ?)
  `).run(token, expires.toISOString());

  return token;
}

export function validateAdminSession(token: string): boolean {
  if (!token) return false;
  const db = getDb();
  const session = db.prepare(`
    SELECT token FROM admin_sessions
    WHERE token = ? AND expires_at > datetime('now')
  `).get(token);
  return session !== undefined;
}

export function destroyAdminSession(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

export function validateAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}
