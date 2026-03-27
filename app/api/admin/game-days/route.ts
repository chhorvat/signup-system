import { NextRequest, NextResponse } from 'next/server';
import { listGameDays, createGameDay } from '@/lib/gameDays';

export async function GET() {
  try {
    const days = listGameDays();
    return NextResponse.json(days);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch game days.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, time, location, notes, player_cap } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required.' }, { status: 400 });
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: 'Valid time (HH:MM) is required.' }, { status: 400 });
    }
    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return NextResponse.json({ error: 'Location is required.' }, { status: 400 });
    }

    const cap = player_cap ? Number(player_cap) : 12;
    if (isNaN(cap) || cap < 1 || cap > 100) {
      return NextResponse.json({ error: 'Player cap must be between 1 and 100.' }, { status: 400 });
    }

    const gameDay = createGameDay({
      date,
      time,
      location: location.trim(),
      notes: notes?.trim() || undefined,
      player_cap: cap,
    });

    return NextResponse.json(gameDay, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'A game day already exists for that date.' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to create game day.' }, { status: 500 });
  }
}
