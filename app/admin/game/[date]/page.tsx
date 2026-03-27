import { notFound } from 'next/navigation';
import { getGameDay } from '@/lib/gameDays';
import { getSignupsForDay } from '@/lib/signups';
import AdminGameClient from '@/components/AdminGameClient';

export default async function AdminGamePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const gameDay = getGameDay(date);
  if (!gameDay) notFound();
  const { confirmed, waitlist } = getSignupsForDay(gameDay.id);

  return (
    <AdminGameClient
      gameDay={gameDay}
      confirmed={confirmed}
      waitlist={waitlist}
    />
  );
}
