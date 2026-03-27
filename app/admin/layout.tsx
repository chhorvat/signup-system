import LogoutButton from '@/components/LogoutButton';

// Middleware handles authentication redirects for /admin/* routes.
// The login page (/admin/login) is excluded from the middleware auth check.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-800">Admin</span>
          <span className="text-gray-300">/</span>
          <a href="/admin" className="text-blue-600 hover:underline text-sm">Dashboard</a>
        </div>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
