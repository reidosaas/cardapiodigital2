import { Loader2 } from 'lucide-react';

export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-lg font-medium text-gray-600">My Love Delivery</p>
      </div>
    </div>
  );
}
