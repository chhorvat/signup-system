import { NextRequest, NextResponse } from 'next/server';
import { getGameDayById } from '@/lib/gameDays';
import { createSignup } from '@/lib/signups';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameDayId, name, email } = body;

    if (!gameDayId || typeof gameDayId !== 'number') {
      return NextResponse.json({ error: 'Invalid game day.' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Name is required (max 100 characters).' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const gameDay = getGameDayById(gameDayId);
    if (!gameDay) {
      return NextResponse.json({ error: 'Game day not found.' }, { status: 404 });
    }

    const result = createSignup(
      gameDayId,
      name.trim(),
      email.trim().toLowerCase(),
      gameDay.date,
      gameDay.time,
      gameDay.location,
      gameDay.player_cap
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      status: result.status,
      position: result.status === 'waitlist' ? result.position : undefined,
      cancelToken: result.signup.cancel_token,
      gameDayId,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
