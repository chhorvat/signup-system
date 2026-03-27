import { listGameDays } from '@/lib/gameDays';
import { isPast, isToday, parseISO } from 'date-fns';
import { formatDate, formatTime } from '@/lib/formatters';

export default function HomePage() {
  const allDays = listGameDays();
  const upcoming = allDays.filter(d => !isPast(parseISO(d.date)) || isToday(parseISO(d.date)));
  const past = allDays.filter(d => isPast(parseISO(d.date)) && !isToday(parseISO(d.date)));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Upcoming Games</h1>
      <p className="text-gray-500 mb-6 text-sm">Sign up for a spot — first {12} players confirmed, rest go on the waitlist.</p>

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
          const isFull = spotsLeft <= 0;
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
                  {day.notes && (
                    <div className="text-sm text-gray-600 mt-1 italic">{day.notes}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {isFull ? (
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      Full
                      {day.waitlist_count > 0 && ` +${day.waitlist_count} waitlist`}
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
