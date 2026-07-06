import { Store } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Store className="h-8 w-8 text-white" />
        </div>
        <p className="text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}
