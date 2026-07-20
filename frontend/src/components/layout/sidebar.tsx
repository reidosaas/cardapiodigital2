'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { removeTokens } from '@/lib/token';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  MessageCircle,
  BarChart3,
  Settings,
  Store,
  Image,
  BadgePercent,
  Truck,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  UserPlus,
  Tags,
  Table2,
  Key,
} from 'lucide-react';

const vendedorLinks = [
  { href: '/dashboard/vendedor', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/vendedor/catalogo', icon: Store, label: 'Catalogo' },
  { href: '/dashboard/vendedor/produtos', icon: Package, label: 'Produtos' },
  { href: '/dashboard/vendedor/pedidos', icon: ShoppingCart, label: 'Pedidos' },
  { href: '/dashboard/vendedor/mesas', icon: Table2, label: 'Mesas' },
  { href: '/dashboard/vendedor/leads', icon: UserPlus, label: 'Leads' },
  { href: '/dashboard/vendedor/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/dashboard/vendedor/conversas', icon: MessageCircle, label: 'Conversas' },
  { href: '/dashboard/vendedor/cupons', icon: BadgePercent, label: 'Cupons' },
  { href: '/dashboard/vendedor/garcons', icon: Users, label: 'Garcons' },
  { href: '/dashboard/vendedor/entregadores', icon: Truck, label: 'Entregadores' },
  { href: '/dashboard/vendedor/despesas', icon: DollarSign, label: 'Despesas' },
  { href: '/dashboard/vendedor/financeiro', icon: BarChart3, label: 'Financeiro' },
  { href: '/dashboard/vendedor/relatorios', icon: BarChart3, label: 'Relatorios' },
  { href: '/dashboard/vendedor/configuracoes', icon: Settings, label: 'Configuracoes' },
];

const adminLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/vendedores', icon: Store, label: 'Vendedores' },
  { href: '/admin/entregadores', icon: Truck, label: 'Entregadores' },
  { href: '/admin/usuarios', icon: Key, label: 'Senhas' },
  { href: '/admin/categorias', icon: Tags, label: 'Categorias' },
  { href: '/admin/planos', icon: BadgePercent, label: 'Planos' },
  { href: '/admin/financeiro', icon: DollarSign, label: 'Financeiro' },
  { href: '/admin/logs', icon: BarChart3, label: 'Logs' },
  { href: '/admin/sistema', icon: Settings, label: 'Sistema' },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onLinkClick?: () => void;
}

export function Sidebar({ isOpen, onToggle, onLinkClick }: SidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const links = isAdmin ? adminLinks : vendedorLinks;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
          isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-16',
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          {isOpen && (
            <span className="text-lg font-bold text-gradient">CardapioDigital</span>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
                onClick={onLinkClick}
              >
                <link.icon size={20} />
                {isOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              removeTokens();
              window.location.href = isAdmin ? '/admin/login' : '/auth/login';
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut size={20} />
            {isOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
