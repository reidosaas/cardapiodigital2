import { Providers } from './providers';
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>CardapioAI - Catalogo Online</title>
        <meta name="description" content="Cardapio Digital Inteligente - Peça online e receba em casa" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CardapioAI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="CardapioAI" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`
        }} />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-950 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
