import { nanoid } from 'nanoid';

export function generateCancelToken(): string {
  return nanoid(21);
}

export function generateSessionToken(): string {
  return nanoid(32);
}
