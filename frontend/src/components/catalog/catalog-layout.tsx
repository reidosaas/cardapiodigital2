'use client';

interface CatalogLayoutProps {
  children: React.ReactNode;
  vendedor: {
    nomeLoja: string;
    descricao?: string | null;
    logoUrl?: string | null;
    corPrimaria?: string | null;
    corSecundaria?: string | null;
    modoEscuro?: boolean | null;
    whatsappNumero?: string | null;
  };
}

export function CatalogLayout({ children, vendedor }: CatalogLayoutProps) {
  const corPrimaria = vendedor.corPrimaria || '#2563eb';
  const corSecundaria = vendedor.corSecundaria || '#7c3aed';

  return (
    <div className={vendedor.modoEscuro ? 'dark' : ''}>
      <style>{`
        :root { --primary: ${corPrimaria}; --secondary: ${corSecundaria}; }
        .bg-primary { background-color: ${corPrimaria} !important; }
        .text-primary { color: ${corPrimaria} !important; }
        .border-primary { border-color: ${corPrimaria} !important; }
        .ring-primary\\/50 { --tw-ring-color: ${corPrimaria}80 !important; }
        .hover\\:bg-primary\\/90:hover { background-color: ${corPrimaria}E6 !important; }
      `}</style>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          {vendedor.logoUrl && (
            <img src={vendedor.logoUrl} alt={vendedor.nomeLoja} className="w-8 h-8 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 dark:text-gray-100 truncate">{vendedor.nomeLoja}</h1>
            {vendedor.descricao && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{vendedor.descricao}</p>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
