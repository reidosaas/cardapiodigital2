'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, MapPin, ClipboardList, LogOut, Sun, Moon, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstallButton } from '@/components/shared/install-button';

const navItems = [
  { href: '/cliente/perfil', label: 'Perfil', icon: User },
  { href: '/cliente/enderecos', label: 'Enderecos', icon: MapPin },
  { href: '/cliente/pedidos', label: 'Pedidos', icon: ClipboardList },
];

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cliente, setCliente] = useState<any>(null);
  const [dark, setDark] = useState(false);

  const isAuthPage = pathname === '/cliente/cadastro' || pathname === '/cliente/login';

  useEffect(() => {
    document.querySelectorAll('link[rel="manifest"]').forEach((el) => el.parentElement?.removeChild(el));
    const linkEl = document.createElement('link');
    linkEl.id = 'dynamic-manifest';
    linkEl.rel = 'manifest';
    linkEl.href = '/pwa/manifest/cliente';
    document.head.appendChild(linkEl);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/pwa/sw/cliente', { scope: '/cliente/' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isAuthPage) return;
    const token = localStorage.getItem('token_cliente');
    if (!token) {
      router.replace('/cliente/login');
      return;
    }
    const c = localStorage.getItem('cliente');
    if (c) setCliente(JSON.parse(c));
  }, [router, pathname, isAuthPage]);

  const handleLogout = () => {
    localStorage.removeItem('token_cliente');
    localStorage.removeItem('cliente');
    window.location.href = '/cliente/login';
  };

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/cliente/perfil" className="flex items-center gap-2">
            <User className="h-5 w-5 text-red-500" />
            <span className="font-bold text-sm">{cliente?.nome || 'Minha Conta'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <InstallButton variant="outline" />
            <Button variant="ghost" size="sm" onClick={() => setDark(!dark)} className="text-gray-500">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t z-50">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  active ? 'text-red-500' : 'text-gray-500'
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
