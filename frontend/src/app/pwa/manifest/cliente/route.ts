import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const manifest = {
    name: 'Minha Conta - My Love Delivery',
    short_name: 'Cliente',
    description: 'Area do Cliente - My Love Delivery',
    id: '/cliente',
    start_url: '/cliente/login',
    scope: '/cliente',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ef4444',
    orientation: 'portrait-primary',
    categories: ['food', 'shopping'],
    icons: [
      { src: '/pwa/icon/cliente?size=192', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/pwa/icon/cliente?size=512', sizes: '512x512', type: 'image/svg+xml' },
      { src: '/pwa/icon/cliente?size=512', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
