'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GameDayWithCounts } from '@/lib/gameDays';
import type { Signup } from '@/lib/signups';
import { formatDate, formatTime } from '@/lib/formatters';

interface Props {
  gameDay: GameDayWithCounts;
  confirmed: Signup[];
  waitlist: Signup[];
}

function formatSignupTime(iso: string) {
  try {
    return new Date(iso + 'Z').toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
}

function AttendanceToggle({ signupId, attended }: { signupId: number; attended: number | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setAttended(value: boolean | null) {
    setLoading(true);
    try {
      await fetch(`/api/admin/signups/${signupId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended: value }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex items-center justify-center gap-1 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        onClick={() => setAttended(attended === 1 ? null : true)}
        title="Mark attended"
        className={`w-6 h-6 rounded-full text-xs font-bold transition-colors ${attended === 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'}`}
      >✓</button>
      <button
        onClick={() => setAttended(attended === 0 ? null : false)}
        title="Mark no-show"
        className={`w-6 h-6 rounded-full text-xs font-bold transition-colors ${attended === 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'}`}
      >✗</button>
    </div>
  );
}

export default function AdminGameClient({ gameDay, confirmed, waitlist }: Props) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleRemove(id: number, name: string) {
    if (!confirm(`Remove ${name} from this game?`)) return;
    setRemovingId(id);
    try {
      const res = await fetch(`/api/admin/signups/${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('Failed to remove player.'); return; }
      router.refresh();
    } catch {
      alert('Network error.');
    } finally {
      setRemovingId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameDayId: gameDay.id, name: addName.trim(), email: addEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Failed to add player.'); return; }
      setAddName('');
      setAddEmail('');
      router.refresh();
    } catch {
      setAddError('Network error.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <a href="/admin" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; All game days</a>
        <h1 className="text-xl font-bold">{formatDate(gameDay.date)}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{formatTime(gameDay.time)} &middot; {gameDay.location}</p>
        {gameDay.notes && <p className="text-gray-600 text-sm mt-1 italic">{gameDay.notes}</p>}
        <a href={`/game/${gameDay.date}`} target="_blank" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
          View public page &rarr;
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Confirmed players */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-blue-700 text-white px-4 py-3 font-semibold text-sm flex justify-between">
              <span>Confirmed Players</span>
              <span className="opacity-75">{confirmed.length}/{gameDay.player_cap}</span>
            </div>
            {confirmed.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No confirmed players yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-8">#</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Name</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 hidden md:table-cell">Email</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Attended</th>
                    <th className="px-4 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {confirmed.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{s.email}</td>
                      <td className="px-3 py-2.5 text-center">
                        <AttendanceToggle signupId={s.id} attended={s.attended} />
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => handleRemove(s.id, s.name)} disabled={removingId === s.id}
                          className="text-red-400 hover:text-red-600 text-xs disabled:opacity-50">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Waitlist */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-yellow-500 text-white px-4 py-3 font-semibold text-sm flex justify-between">
              <span>Waitlist</span>
              <span className="opacity-75">{waitlist.length} waiting</span>
            </div>
            {waitlist.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Waitlist is empty.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-10">Pos</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Name</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 hidden lg:table-cell">Signed Up</th>
                    <th className="px-4 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {waitlist.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-yellow-500 font-semibold">#{s.waitlist_pos}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{s.email}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell">{formatSignupTime(s.signed_up_at)}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => handleRemove(s.id, s.name)} disabled={removingId === s.id}
                          className="text-red-400 hover:text-red-600 text-xs disabled:opacity-50">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add player form */}
        <div>
          <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3">Add Player</h3>
            <p className="text-xs text-gray-500 mb-3">Admin adds bypass the player cap.</p>
            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">{addError}</div>
            )}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required value={addName} onChange={e => setAddName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={addEmail} onChange={e => setAddEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={adding}
                className="w-full bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {adding ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
