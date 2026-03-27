import { NextRequest, NextResponse } from 'next/server';
import { markAttendance } from '@/lib/signups';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { attended } = body; // true, false, or null

    if (attended !== true && attended !== false && attended !== null) {
      return NextResponse.json({ error: 'attended must be true, false, or null.' }, { status: 400 });
    }

    const updated = markAttendance(Number(id), attended);
    if (!updated) return NextResponse.json({ error: 'Signup not found.' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update attendance.' }, { status: 500 });
  }
}
