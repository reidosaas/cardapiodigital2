'use client';
import { AuthProvider } from '@/hooks/useAuth';
import { AppThemeProvider } from '@/hooks/useAppTheme';
import { Toaster } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </AppThemeProvider>
  );
}
