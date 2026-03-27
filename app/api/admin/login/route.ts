import { NextRequest, NextResponse } from 'next/server';
import { validateAdminPassword, createAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password || !validateAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    const token = createAdminSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
