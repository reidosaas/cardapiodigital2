import { Providers } from './providers';
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>CardapioDigital - Catalogo Online</title>
        <meta name="description" content="Sistema SaaS de Cardapio Digital e Catalogo Online" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-950 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
