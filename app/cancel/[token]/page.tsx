export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface SignupInfo {
  name: string;
  gameDate: string;
  gameTime: string;
  gameLocation: string;
  status: 'confirmed' | 'waitlist';
  waitlistPos?: number;
}

export default function CancelPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<SignupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cancel/info?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setInfo(data);
      })
      .catch(() => setError('Failed to load signup info.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to cancel.');
        return;
      }

      // Clear from localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('cancel_tokens') || '{}');
        Object.keys(stored).forEach(k => {
          if (stored[k] === token) delete stored[k];
        });
        localStorage.setItem('cancel_tokens', JSON.stringify(stored));
      } catch {
        // ignore
      }

      setCancelled(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  function formatDate(dateStr: string) {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return dateStr; }
  }

  function formatTime(timeStr: string) {
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(); d.setHours(h, m);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return timeStr; }
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-4 animate-bounce">🏀</div>
        <p>Loading...</p>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">You&apos;ve been removed</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your spot has been cancelled. If you were confirmed, the next person on the waitlist has been notified.
        </p>
        <a href="/" className="text-blue-600 hover:underline text-sm">Back to all games</a>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-5xl mb-4">🤔</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Link not found</h1>
        <p className="text-gray-500 text-sm mb-6">
          This cancel link may have already been used or is invalid.
        </p>
        <a href="/" className="text-blue-600 hover:underline text-sm">Back to all games</a>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <div className="text-4xl mb-4">🏀</div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Cancel your signup?</h1>
        <p className="text-gray-500 text-sm mb-4">
          You are currently signed up as:
        </p>

        <div className="bg-gray-50 rounded-lg p-4 text-left mb-5 space-y-1 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{info.name}</span></div>
          <div><span className="text-gray-500">Game:</span> <span className="font-medium">{formatDate(info.gameDate)}</span></div>
          <div><span className="text-gray-500">Time:</span> <span className="font-medium">{formatTime(info.gameTime)}</span></div>
          <div><span className="text-gray-500">Location:</span> <span className="font-medium">{info.gameLocation}</span></div>
          <div>
            <span className="text-gray-500">Status:</span>{' '}
            {info.status === 'confirmed' ? (
              <span className="text-green-600 font-medium">Confirmed</span>
            ) : (
              <span className="text-yellow-600 font-medium">Waitlist #{info.waitlistPos}</span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full bg-red-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {cancelling ? 'Cancelling...' : 'Yes, cancel my spot'}
        </button>

        <a href={`/game/${info.gameDate}`} className="block mt-3 text-sm text-gray-400 hover:text-gray-600">
          Never mind, keep my spot
        </a>
      </div>
    </div>
  );
}
