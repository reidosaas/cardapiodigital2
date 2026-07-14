'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (loading) return;
    if (isLoginPage) return;
    if (!user) {
      router.push('/admin/login');
    }
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard/vendedor');
    }
  }, [user, loading, router, isLoginPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoginPage && (!user || user.role !== 'ADMIN')) return null;

  return <>{children}</>;
}
