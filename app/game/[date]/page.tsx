export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getGameDay } from '@/lib/gameDays';
import { getSignupsForDay } from '@/lib/signups';
import { formatDate, formatTime } from '@/lib/formatters';
import SignupForm from '@/components/SignupForm';
import CancelButton from '@/components/CancelButton';

export default async function GamePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const gameDay = getGameDay(date);
  if (!gameDay) notFound();

  const { confirmed, waitlist } = getSignupsForDay(gameDay.id);
  const spotsLeft = gameDay.player_cap - confirmed.length;
  const isFull = spotsLeft <= 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <a href="/" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; All games</a>
        <h1 className="text-2xl font-bold">{formatDate(gameDay.date)}</h1>
        <p className="text-gray-500 mt-1">
          {formatTime(gameDay.time)} &middot; {gameDay.location}
        </p>
        {gameDay.notes && <p className="text-gray-600 mt-1 text-sm italic">{gameDay.notes}</p>}
        <div className="mt-3">
          {isFull ? (
            <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full">
              Full &mdash; {waitlist.length > 0 ? `${waitlist.length} on waitlist` : 'waitlist open'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} available
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Roster + Waitlist */}
        <div className="space-y-6">
          {/* Confirmed roster */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-blue-700 text-white px-4 py-3 font-semibold text-sm flex items-center justify-between">
              <span>Confirmed Players</span>
              <span className="opacity-75">{confirmed.length}/{gameDay.player_cap}</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {confirmed.map((s, i) => (
                <li key={s.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                  <span className="text-gray-400 w-5 text-right font-mono">{i + 1}</span>
                  <span className="font-medium text-gray-800">{s.name}</span>
                </li>
              ))}
              {Array.from({ length: Math.max(0, gameDay.player_cap - confirmed.length) }).map((_, i) => (
                <li key={`empty-${i}`} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                  <span className="text-gray-300 w-5 text-right font-mono">{confirmed.length + i + 1}</span>
                  <span className="text-gray-300 italic">— open —</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Waitlist */}
          {waitlist.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-yellow-500 text-white px-4 py-3 font-semibold text-sm flex items-center justify-between">
                <span>Waitlist</span>
                <span className="opacity-75">{waitlist.length} waiting</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {waitlist.map(s => (
                  <li key={s.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                    <span className="text-yellow-500 w-5 text-right font-mono">#{s.waitlist_pos}</span>
                    <span className="font-medium text-gray-800">{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Signup form */}
        <div className="space-y-4">
          <SignupForm gameDayId={gameDay.id} gameDate={gameDay.date} />
          <CancelButton gameDayId={gameDay.id} />
        </div>
      </div>
    </div>
  );
}
