import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const host = req.headers.get('host') || 'cardapioai.reidosaas.com.br';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const manifest = {
    name: `My Love Delivery - ${slug}`,
    short_name: slug,
    description: `My Love Delivery - ${slug}`,
    id: `/catalogo/${slug}`,
    start_url: `/catalogo/${slug}`,
    scope: `/catalogo/${slug}`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ef4444',
    orientation: 'portrait-primary',
    categories: ['food', 'business'],
    icons: [
      { src: `/pwa/icon/${slug}?size=192`, sizes: '192x192', type: 'image/png' },
      { src: `/pwa/icon/${slug}?size=512`, sizes: '512x512', type: 'image/png' },
      { src: `/pwa/icon/${slug}?size=512`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
