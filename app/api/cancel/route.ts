import { NextRequest, NextResponse } from 'next/server';
import { cancelSignup } from '@/lib/signups';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
    }

    const result = cancelSignup(token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      promoted: result.promoted ? { name: result.promoted.name } : null,
    });
  } catch (err) {
    console.error('Cancel error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
