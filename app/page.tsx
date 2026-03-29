export const dynamic = 'force-dynamic';

import { listGameDays } from '@/lib/gameDays';
import { getLeaderboardStats } from '@/lib/leaderboard';
import HomePageTabs from '@/components/HomePageTabs';

export default function HomePage() {
  const days    = listGameDays();
  const players = getLeaderboardStats();
  return <HomePageTabs days={days} players={players} />;
}
