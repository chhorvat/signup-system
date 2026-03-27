import { NextRequest, NextResponse } from 'next/server';
import { getGameDayById, updateGameDay, deleteGameDay } from '@/lib/gameDays';
import { getDb } from '@/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gameDay = getGameDayById(Number(id));
    if (!gameDay) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const body = await req.json();
    const updated = updateGameDay(Number(id), body);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'A game day already exists for that date.' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to update game day.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gameDay = getGameDayById(Number(id));
    if (!gameDay) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    // Check for confirmed signups
    const db = getDb();
    const counts = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed,
        COUNT(CASE WHEN status = 'waitlist'  THEN 1 END) AS waitlisted
      FROM signups WHERE game_day_id = ?
    `).get(Number(id)) as { confirmed: number; waitlisted: number };

    deleteGameDay(Number(id));
    return NextResponse.json({ success: true, removedConfirmed: counts.confirmed, removedWaitlisted: counts.waitlisted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete game day.' }, { status: 500 });
  }
}
