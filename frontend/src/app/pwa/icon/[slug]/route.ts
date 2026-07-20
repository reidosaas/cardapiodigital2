import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const size = parseInt(req.nextUrl.searchParams.get('size') || '192');
  const slug = params.slug;
  const initial = (slug[0] || 'L').toUpperCase();

  const colors = [
    '#ef4444', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6',
    '#ef4444', '#14b8a6', '#f59e0b', '#6366f1', '#06b6d4',
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const bgColor = colors[Math.abs(hash) % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bgColor}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="700" font-size="${size * 0.45}">${initial}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
