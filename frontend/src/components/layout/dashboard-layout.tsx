'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LayoutDashboard, ShoppingCart, Package, Settings } from 'lucide-react';

const mobileNavItems = [
  { href: '/dashboard/vendedor', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/dashboard/vendedor/pedidos', icon: ShoppingCart, label: 'Pedidos' },
  { href: '/dashboard/vendedor/produtos', icon: Package, label: 'Produtos' },
  { href: '/dashboard/vendedor/configuracoes', icon: Settings, label: 'Config' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLinkClick = useCallback(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      const isAdminArea = window.location.pathname.startsWith('/admin');
      router.push(isAdminArea ? '/admin/login' : '/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} onLinkClick={handleLinkClick} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className={`flex-1 overflow-y-auto p-4 lg:p-6 ${pathname.startsWith('/admin') ? '' : 'pb-20 lg:pb-6'}`}>
          {children}
        </main>
      </div>

      {/* Mobile nav - lojista only */}
      {!pathname.startsWith('/admin') && (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-gray-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}
