'use client';
import { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallButton({ variant = 'ghost', className = '' }: { variant?: 'ghost' | 'outline' | 'default'; className?: string }) {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOS, setShowIOS] = useState(false);

  if (isInstalled || !canInstall) return null;

  if (isIOS) {
    return (
      <>
        <Button
          variant={variant}
          size="sm"
          onClick={() => setShowIOS(true)}
          className={`flex items-center gap-1.5 text-xs ${className}`}
          title="Instalar app"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Instalar</span>
        </Button>
        {showIOS && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowIOS(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Instalar no iPhone</h3>
                <button onClick={() => setShowIOS(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <p className="text-sm text-gray-700">Toque no botao <strong>Compartilhar</strong> (quadrado com seta) na barra do Safari</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <p className="text-sm text-gray-700">Role para baixo e toque em <strong>Adicionar a Tela de Inicio</strong></p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <p className="text-sm text-gray-700">Toque em <strong>Adicionar</strong> no canto superior direito</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-sm text-green-700 font-medium">Pronto! O app aparecera na sua tela inicial</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOS(false)}
                className="w-full mt-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

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
