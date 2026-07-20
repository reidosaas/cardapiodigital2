import { Providers } from './providers';
import '@/styles/globals.css';

export const metadata = {
  title: 'My Love Delivery',
  description: 'My Love Delivery - Peca online e receba em casa',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'My Love Delivery',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#ef4444',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ef4444" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="My Love Delivery" />
        <link rel="icon" type="image/png" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){var s=(r.scope||'');if(s.endsWith('/')&&!s.includes('/catalogo/')&&!s.includes('/entregador/')&&!s.includes('/admin/')&&!s.includes('/dashboard/')&&!s.includes('/cliente/')){r.unregister()}})})})}`
        }} />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-950 antialiased overscroll-none">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
