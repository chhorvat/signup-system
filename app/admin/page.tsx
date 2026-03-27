import { listGameDays } from '@/lib/gameDays';
import AdminDashboardClient from '@/components/AdminDashboardClient';

export default function AdminDashboard() {
  const days = listGameDays();
  return <AdminDashboardClient days={days} />;
}
