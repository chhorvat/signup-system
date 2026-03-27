'use client';

import type { PlayerStat, GameCancellationSummary } from '@/lib/stats';
import { formatDateShort } from '@/lib/formatters';

interface Props {
  players: PlayerStat[];
  games: GameCancellationSummary[];
}

function ReliabilityBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-gray-400 text-xs">No data</span>;
  if (rate >= 90) return <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">{rate}% ✓</span>;
  if (rate >= 70) return <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">{rate}%</span>;
  return <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{rate}% ⚠</span>;
}

function DayOfBadge({ rate, count }: { rate: number | null; count: number }) {
  if (rate === null || count === 0) return <span className="text-gray-400 text-xs">—</span>;
  if (rate === 0) return <span className="text-green-600 text-xs">0%</span>;
  if (rate <= 20) return <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">{rate}%</span>;
  return <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{rate}% ⚠</span>;
}

export default function AdminStatsClient({ players, games }: Props) {
  const totalDayOf = games.reduce((s, g) => s + g.day_of_count, 0);
  const totalCancels = games.reduce((s, g) => s + g.total_cancellations, 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin" className="text-sm text-blue-600 hover:underline">&larr; Dashboard</a>
        <h1 className="text-xl font-bold">Reliability Stats</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{players.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Players</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{totalCancels}</div>
          <div className="text-xs text-gray-500 mt-1">Total Cancellations</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{totalDayOf}</div>
          <div className="text-xs text-gray-500 mt-1">Day-Of Drops</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">
            {totalCancels > 0 ? Math.round((totalDayOf / totalCancels) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Day-Of Rate</div>
        </div>
      </div>

      {/* Player reliability table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Player Reliability</h2>
        <p className="text-xs text-gray-500 mb-3">
          Day-of = cancelled a confirmed spot within 24h of game time. Cancellations within {10} minutes of signing up are excluded (grace period).
        </p>

        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-200">
            <p>No player data yet. Stats will appear after games are played.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Player</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600">Games</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600">Attendance</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600">Cancels</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600">Day-Of Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {players.map(p => (
                  <tr key={p.email} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-gray-400 text-xs">{p.email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-700">{p.total_confirmed}</td>
                    <td className="px-3 py-2.5 text-center">
                      <ReliabilityBadge rate={p.attendance_rate} />
                      {(p.attended + p.no_shows) > 0 && (
                        <div className="text-gray-400 text-xs mt-0.5">{p.attended}✓ {p.no_shows}✗</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-600">{p.total_cancellations}</td>
                    <td className="px-3 py-2.5 text-center">
                      <DayOfBadge rate={p.day_of_rate} count={p.day_of_cancellations} />
                      {p.day_of_cancellations > 0 && (
                        <div className="text-gray-400 text-xs mt-0.5">{p.day_of_cancellations} drop{p.day_of_cancellations !== 1 ? 's' : ''}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-game cancellation history */}
      {games.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Cancellations by Game</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Game</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Total Cancels</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Day-Of Drops</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Waitlist Cancels</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {games.map(g => (
                  <tr key={g.game_date} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{formatDateShort(g.game_date)}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700">{g.total_cancellations}</td>
                    <td className="px-4 py-2.5 text-center">
                      {g.day_of_count > 0 ? (
                        <span className="text-red-600 font-semibold">{g.day_of_count}</span>
                      ) : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{g.waitlist_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
