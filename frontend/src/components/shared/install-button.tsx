'use client';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallButton({ variant = 'ghost', className = '' }: { variant?: 'ghost' | 'outline' | 'default'; className?: string }) {
  const { canInstall, isInstalled, install } = usePWAInstall();

  if (isInstalled || !canInstall) return null;

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={install}
      className={`flex items-center gap-1.5 text-xs ${className}`}
      title="Instalar app"
    >
      <Download size={14} />
      <span className="hidden sm:inline">Instalar</span>
    </Button>
  );
}
