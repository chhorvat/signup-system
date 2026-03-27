import { NextRequest, NextResponse } from 'next/server';
import { getSignupByToken } from '@/lib/signups';
import { getGameDayById } from '@/lib/gameDays';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token is required.' }, { status: 400 });

  const signup = getSignupByToken(token);
  if (!signup) return NextResponse.json({ error: 'Signup not found.' }, { status: 404 });

  const gameDay = getGameDayById(signup.game_day_id);
  if (!gameDay) return NextResponse.json({ error: 'Game day not found.' }, { status: 404 });

  return NextResponse.json({
    name: signup.name,
    gameDate: gameDay.date,
    gameTime: gameDay.time,
    gameLocation: gameDay.location,
    status: signup.status,
    waitlistPos: signup.waitlist_pos,
  });
}
