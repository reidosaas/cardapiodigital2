'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Truck, Package, BarChart3, Map, LogOut, Menu, X, Store, Sun, Moon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTheme } from '@/hooks/useAppTheme';

const navItems = [
  { href: '/entregador/dashboard', label: 'Pedidos', icon: Package },
  { href: '/entregador/lojas', label: 'Lojas', icon: Store },
  { href: '/entregador/relatorio', label: 'Relatorios', icon: BarChart3 },
  { href: '/entregador/rotas', label: 'Rotas', icon: Map },
  { href: '/entregador/perfil', label: 'Perfil', icon: User },
];

export default function EntregadorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useAppTheme();
  const [entregador, setEntregador] = useState<any>(null);
  const [loja, setLoja] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.querySelectorAll('link[rel="manifest"]').forEach((el) => el.parentElement?.removeChild(el));
    const linkEl = document.createElement('link');
    linkEl.id = 'dynamic-manifest';
    linkEl.rel = 'manifest';
    linkEl.href = '/pwa/manifest/entregador';
    document.head.appendChild(linkEl);

    const iconEl = document.getElementById('dynamic-icon') as HTMLLinkElement || document.createElement('link');
    iconEl.id = 'dynamic-icon';
    iconEl.rel = 'apple-touch-icon';
    iconEl.href = '/pwa/icon/entregador?size=192';
    if (!document.getElementById('dynamic-icon')) {
      document.head.appendChild(iconEl);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/pwa/sw/entregador', { scope: '/entregador/' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (pathname === '/entregador/login' || pathname === '/entregador/cadastro') return;
    const token = localStorage.getItem('token_entregador');
    if (!token) {
      router.replace('/entregador/login');
      return;
    }
    const e = localStorage.getItem('entregador');
    const l = localStorage.getItem('loja_entregador');
    if (e) setEntregador(JSON.parse(e));
    if (l) setLoja(JSON.parse(l));
  }, [router, pathname]);

  if (pathname === '/entregador/login' || pathname === '/entregador/cadastro') return <>{children}</>;

  const handleLogout = () => {
    localStorage.removeItem('token_entregador');
    localStorage.removeItem('entregador');
    localStorage.removeItem('loja_entregador');
    window.location.href = '/entregador/login';
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-sm">{loja?.nomeLoja || 'Entregador'}</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="text-gray-500">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-gray-500 hidden sm:block">{entregador?.nome}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hidden md:flex">
              <LogOut className="h-4 w-4" />
            </Button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-6 safe-area-bottom">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {children}
        </motion.div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  active ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
