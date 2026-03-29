'use client';

import { useState } from 'react';
import { isPast, isToday, parseISO } from 'date-fns';
import { formatDate, formatTime } from '@/lib/formatters';
import type { GameDayWithCounts } from '@/lib/gameDays';
import type { LeaderboardPlayer } from '@/lib/leaderboard';

// ─── Games tab ────────────────────────────────────────────────────────────────

function GamesTab({ days }: { days: GameDayWithCounts[] }) {
  const upcoming = days.filter(d => !isPast(parseISO(d.date)) || isToday(parseISO(d.date)));
  const past     = days.filter(d =>  isPast(parseISO(d.date)) && !isToday(parseISO(d.date)));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Upcoming Games</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Sign up for a spot — first 12 players confirmed, rest go on the waitlist.
      </p>

      {upcoming.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🏀</div>
          <p className="text-lg">No upcoming games scheduled.</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}

      <div className="grid gap-4">
        {upcoming.map(day => {
          const spotsLeft = day.player_cap - day.confirmed_count;
          const isFull    = spotsLeft <= 0;
          return (
            <a
              key={day.id}
              href={`/game/${day.date}`}
              className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-lg text-gray-900">{formatDate(day.date)}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {formatTime(day.time)} &middot; {day.location}
                  </div>
                  {day.notes && <div className="text-sm text-gray-600 mt-1 italic">{day.notes}</div>}
                </div>
                <div className="text-right shrink-0">
                  {isFull ? (
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      Full{day.waitlist_count > 0 && ` +${day.waitlist_count} waitlist`}
                    </span>
                  ) : (
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                    </span>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {day.confirmed_count}/{day.player_cap} confirmed
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {past.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-400 mb-3">Past Games</h2>
          <div className="grid gap-3">
            {past.slice(-5).reverse().map(day => (
              <a
                key={day.id}
                href={`/game/${day.date}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="font-medium">{formatDate(day.date)}</span>
                <span className="text-sm ml-2">&middot; {day.confirmed_count} played</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Leaderboard tab ──────────────────────────────────────────────────────────

type SortMode = 'attendance' | 'dayof';

function pct(n: number | null): string {
  return n === null ? '—' : `${n}%`;
}

function LeaderboardTab({ players }: { players: LeaderboardPlayer[] }) {
  const [sort, setSort] = useState<SortMode>('attendance');

  // All-Stars: top 3 by total historical signups
  const allStars = [...players]
    .sort((a, b) => b.total_signups - a.total_signups)
    .slice(0, 3);
  const allStarEmails = new Set(allStars.map(p => p.email));

  // Sorted list for rankings
  const sorted = [...players]
    .filter(p => p.games_tracked >= 3)
    .sort((a, b) => {
      if (sort === 'attendance') {
        return (b.attendance_rate ?? -1) - (a.attendance_rate ?? -1);
      }
      // day-of cancel %: lower is better, so sort ASC
      return (a.day_of_rate ?? 101) - (b.day_of_rate ?? 101);
    });

  const mostReliableSet  = new Set(sorted.slice(0, 10).map(p => p.email));
  const leastReliableSet = new Set(sorted.slice(-5).map(p => p.email));

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      {/* All-Stars */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <span>⭐</span> JCC All-Stars
        </h2>
        <p className="text-sm text-gray-500 mb-4">Most games played all-time</p>
        <div className="grid grid-cols-3 gap-3">
          {allStars.map((p, i) => (
            <div
              key={p.email}
              className={`rounded-xl border p-4 text-center ${
                i === 0 ? 'bg-yellow-50 border-yellow-300' :
                i === 1 ? 'bg-gray-50 border-gray-300' :
                          'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="text-2xl mb-1">{medals[i]}</div>
              <div className="font-semibold text-sm text-gray-900 leading-tight">{p.name}</div>
              <div className="text-xs text-gray-500 mt-1">{p.total_signups} games</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rankings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Reliability Rankings</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSort('attendance')}
              className={`px-3 py-1.5 rounded-md transition-colors ${sort === 'attendance' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Overall
            </button>
            <button
              onClick={() => setSort('dayof')}
              className={`px-3 py-1.5 rounded-md transition-colors ${sort === 'dayof' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Same-Day Cancels
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-400 flex gap-3 mb-2 px-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Top 10: Most Reliable</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Bottom 5: Least Reliable</span>
          <span className="flex items-center gap-1"><span>⭐</span> All-Star</span>
        </div>

        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[2rem_1fr_5rem_5rem_4rem] gap-2 text-xs text-gray-400 font-medium px-3 py-1">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Att. %</span>
            <span className="text-right">Same-day %</span>
            <span className="text-right">Games</span>
          </div>

          {sorted.map((p, i) => {
            const isMR = mostReliableSet.has(p.email);
            const isLR = leastReliableSet.has(p.email);
            const isAS = allStarEmails.has(p.email);

            return (
              <div
                key={p.email}
                className={`grid grid-cols-[2rem_1fr_5rem_5rem_4rem] gap-2 items-center px-3 py-2 rounded-lg text-sm ${
                  isMR ? 'bg-green-50 border border-green-100' :
                  isLR ? 'bg-red-50 border border-red-100' :
                         'bg-white border border-gray-100'
                }`}
              >
                <span className="text-gray-400 text-xs font-mono">{i + 1}</span>
                <span className="font-medium text-gray-900 flex items-center gap-1 min-w-0">
                  <span className="truncate">{p.name}</span>
                  {isAS && <span className="text-yellow-500 shrink-0">⭐</span>}
                  {isMR && <span className="shrink-0 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Reliable</span>}
                  {isLR && <span className="shrink-0 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Unreliable</span>}
                </span>
                <span className={`text-right font-mono text-xs ${
                  p.attendance_rate === null ? 'text-gray-300' :
                  p.attendance_rate >= 80 ? 'text-green-600 font-semibold' :
                  p.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {pct(p.attendance_rate)}
                </span>
                <span className={`text-right font-mono text-xs ${
                  p.day_of_rate === null ? 'text-gray-300' :
                  p.day_of_rate === 0 ? 'text-green-600 font-semibold' :
                  p.day_of_rate <= 15 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {pct(p.day_of_rate)}
                </span>
                <span className="text-right text-gray-400 text-xs">{p.games_tracked}</span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Stats based on past games only &middot; Min. 3 games to appear
        </p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomePageTabs({
  days,
  players,
}: {
  days: GameDayWithCounts[];
  players: LeaderboardPlayer[];
}) {
  const [tab, setTab] = useState<'games' | 'leaderboard'>('games');

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setTab('games')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === 'games' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏀 Games
        </button>
        <button
          onClick={() => setTab('leaderboard')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === 'leaderboard' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏆 JCC&apos;s Most Reliable
        </button>
      </div>

      {tab === 'games'
        ? <GamesTab days={days} />
        : <LeaderboardTab players={players} />
      }
    </div>
  );
}
