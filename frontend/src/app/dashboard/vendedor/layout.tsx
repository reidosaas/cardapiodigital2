'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardVendedorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.querySelectorAll('link[rel="manifest"]').forEach((el) => el.parentElement?.removeChild(el));
    const linkEl = document.createElement('link');
    linkEl.id = 'dynamic-manifest';
    linkEl.rel = 'manifest';
    linkEl.href = '/pwa/manifest/lojista';
    document.head.appendChild(linkEl);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/pwa/sw/lojista', { scope: '/dashboard/' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
    }
  }, [router, pathname]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
