import { NextRequest, NextResponse } from 'next/server';
import { adminRemoveSignup } from '@/lib/signups';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = adminRemoveSignup(Number(id));

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, promoted: result.promoted ? { name: result.promoted.name } : null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to remove signup.' }, { status: 500 });
  }
}
