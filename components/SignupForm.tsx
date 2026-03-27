'use client';

import { useState } from 'react';

interface Props {
  gameDayId: number;
  gameDate: string;
}

interface SignupResult {
  status: 'confirmed' | 'waitlist';
  position?: number;
  cancelToken: string;
  gameDayId: number;
}

export default function SignupForm({ gameDayId, gameDate }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameDayId, name: name.trim(), email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Store cancel token in localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('cancel_tokens') || '{}');
        stored[`game_${gameDayId}`] = data.cancelToken;
        localStorage.setItem('cancel_tokens', JSON.stringify(stored));
      } catch {
        // localStorage may be unavailable
      }

      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className={`rounded-xl p-5 border ${result.status === 'confirmed' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        {result.status === 'confirmed' ? (
          <>
            <div className="text-green-700 font-semibold text-lg">You&apos;re confirmed!</div>
            <p className="text-green-700 text-sm mt-1">Check your email for a confirmation and cancel link.</p>
          </>
        ) : (
          <>
            <div className="text-yellow-700 font-semibold text-lg">You&apos;re #{result.position} on the waitlist</div>
            <p className="text-yellow-700 text-sm mt-1">We&apos;ll email you right away if a spot opens up.</p>
          </>
        )}
        <a
          href={`/cancel/${result.cancelToken}`}
          className="inline-block mt-3 text-sm text-red-600 hover:underline"
        >
          Cancel my signup
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Sign Up</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="Your name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </div>
    </form>
  );
}
