'use client';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}
