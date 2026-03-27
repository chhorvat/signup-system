'use client';

import { useEffect, useState } from 'react';

interface Props {
  gameDayId: number;
}

export default function CancelButton({ gameDayId }: Props) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cancel_tokens') || '{}');
      const t = stored[`game_${gameDayId}`];
      if (t) setToken(t);
    } catch {
      // ignore
    }
  }, [gameDayId]);

  if (!token) return null;

  return (
    <div className="mt-4 text-center">
      <a
        href={`/cancel/${token}`}
        className="inline-block text-sm text-red-600 hover:underline border border-red-200 bg-red-50 px-4 py-2 rounded-lg"
      >
        Cancel my signup for this game
      </a>
    </div>
  );
}
