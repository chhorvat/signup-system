import { getPlayerStats, getGameCancellationStats } from '@/lib/stats';
import AdminStatsClient from '@/components/AdminStatsClient';

export default function AdminStatsPage() {
  const players = getPlayerStats();
  const games = getGameCancellationStats();
  return <AdminStatsClient players={players} games={games} />;
}
