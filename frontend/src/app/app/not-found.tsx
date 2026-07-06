import Link from 'next/link';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
          <Store className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <p className="text-gray-500 mb-6">Pagina nao encontrada</p>
        <Link href="/">
          <Button>Voltar ao Inicio</Button>
        </Link>
      </div>
    </div>
  );
}
