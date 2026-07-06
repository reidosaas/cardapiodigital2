'use client';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <Store className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Algo deu errado</h1>
        <p className="text-gray-500 mb-6">Ocorreu um erro inesperado. Tente novamente.</p>
        <Button onClick={reset}>Tentar Novamente</Button>
      </div>
    </div>
  );
}
