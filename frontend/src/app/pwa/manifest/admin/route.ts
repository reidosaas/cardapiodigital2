import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const manifest = {
    name: 'Admin CardapioAI',
    short_name: 'Admin',
    description: 'Painel Administrativo - CardapioAI',
    id: '/admin',
    start_url: '/admin/login',
    scope: '/admin',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e293b',
    orientation: 'portrait-primary',
    categories: ['business'],
    icons: [
      { src: '/pwa/icon/admin?size=192', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icon/admin?size=512', sizes: '512x512', type: 'image/png' },
      { src: '/pwa/icon/admin?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
