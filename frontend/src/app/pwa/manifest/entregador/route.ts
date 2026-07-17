import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'cardapioai.reidosaas.com.br';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  const manifest = {
    name: 'Entregador CardapioAI',
    short_name: 'Entregador',
    description: 'Area do Entregador - CardapioAI',
    start_url: '/entregador/login',
    scope: '/entregador',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    orientation: 'portrait-primary',
    categories: ['business'],
    icons: [
      { src: '/pwa/icon/entregador?size=192', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icon/entregador?size=512', sizes: '512x512', type: 'image/png' },
      { src: '/pwa/icon/entregador?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
