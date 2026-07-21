import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const manifest = {
    name: 'Lojista - My Love Delivery',
    short_name: 'Lojista',
    description: 'Painel do Lojista - My Love Delivery',
    id: '/dashboard',
    start_url: '/dashboard/vendedor',
    scope: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ef4444',
    orientation: 'portrait-primary',
    categories: ['business'],
    icons: [
      { src: '/pwa/icons/lojista-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icons/lojista-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/pwa/icons/lojista-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
