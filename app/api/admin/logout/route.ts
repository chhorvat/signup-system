import { NextRequest, NextResponse } from 'next/server';
import { destroyAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  if (token) destroyAdminSession(token);

  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}
