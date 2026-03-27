'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GameDayWithCounts } from '@/lib/gameDays';
import { formatDateShort, formatTime } from '@/lib/formatters';

interface Props {
  days: GameDayWithCounts[];
}

export default function AdminDashboardClient({ days }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    date: '',
    time: '18:00',
    location: 'Main Gym',
    notes: '',
    player_cap: '12',
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/admin/game-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, player_cap: Number(form.player_cap) }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create game day.'); return; }
      setShowCreate(false);
      setForm({ date: '', time: '18:00', location: 'Main Gym', notes: '', player_cap: '12' });
      router.refresh();
    } catch {
      setCreateError('Network error.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number, date: string) {
    if (!confirm(`Delete game on ${formatDateShort(date)}? This will remove all signups.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/game-days/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch {
      alert('Failed to delete game day.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Game Days</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Game Day
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-blue-900">New Game Day</h2>
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{createError}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
              <input type="time" required value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input type="text" required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Player Cap</label>
              <input type="number" min="1" max="100" required value={form.player_cap}
                onChange={e => setForm(f => ({ ...f, player_cap: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Bring a light and dark shirt"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Game days table */}
      {days.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📅</div>
          <p>No game days yet. Create one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Location</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Confirmed</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Waitlist</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {days.map(day => (
                <tr key={day.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{formatDateShort(day.date)}</div>
                    <div className="text-gray-400 text-xs">{formatTime(day.time)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{day.location}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={day.confirmed_count >= day.player_cap ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      {day.confirmed_count}/{day.player_cap}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {day.waitlist_count > 0 ? (
                      <span className="text-yellow-600 font-semibold">{day.waitlist_count}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/admin/game/${day.date}`}
                        className="text-blue-600 hover:underline text-xs font-medium">
                        Manage
                      </a>
                      <a href={`/game/${day.date}`} target="_blank"
                        className="text-gray-400 hover:text-gray-600 text-xs">
                        View
                      </a>
                      <button onClick={() => handleDelete(day.id, day.date)}
                        disabled={deletingId === day.id}
                        className="text-red-400 hover:text-red-600 text-xs disabled:opacity-50">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
