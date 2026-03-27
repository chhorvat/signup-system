import { NextResponse } from 'next/server';
import { getPlayerStats, getGameCancellationStats } from '@/lib/stats';

export async function GET() {
  try {
    const players = getPlayerStats();
    const games = getGameCancellationStats();
    return NextResponse.json({ players, games });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load stats.' }, { status: 500 });
  }
}
