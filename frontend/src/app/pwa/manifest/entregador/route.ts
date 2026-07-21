import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'cardapioai.reidosaas.com.br';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  const manifest = {
    name: 'Entregador - My Love Delivery',
    short_name: 'Entregador',
    description: 'Area do Entregador - My Love Delivery',
    id: '/entregador',
    start_url: '/entregador/login',
    scope: '/entregador',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ef4444',
    orientation: 'portrait-primary',
    categories: ['business'],
    icons: [
      { src: '/pwa/icons/entregador-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icons/entregador-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/pwa/icons/entregador-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
