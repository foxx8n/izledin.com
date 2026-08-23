import { NextRequest, NextResponse } from 'next/server';
import { getTrendingMedia, searchCatalog, getOMDBDetails } from '@/lib/omdb';

export const revalidate = 86400; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all') as 'all' | 'movie' | 'tv' | 'anime';
    const query = searchParams.get('q');
    const id = searchParams.get('id');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10))) : 20;
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;

    // Single-item lookup by external id (used by client components — the
    // OMDB key is server-only, so browsers must go through this proxy).
    // Only IMDb-style ids (tt + 7-8 digits) are allowed through to OMDB.
    if (id && id.trim()) {
      const trimmedId = id.trim();
      if (!/^tt\d{7,8}$/.test(trimmedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid media id' },
          { status: 400 }
        );
      }
      const item = await getOMDBDetails(trimmedId);
      return NextResponse.json(
        { success: true, item },
        {
          status: 200,
          headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
        },
      );
    }

    let items;
    if (query && query.trim()) {
      items = await searchCatalog(query.trim(), limit);
    } else {
      items = await getTrendingMedia(type, limit, offset);
    }

    return NextResponse.json(
      {
        success: true,
        count: items.length,
        items,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
          'CDN-Cache-Control': 'max-age=86400',
          'Vercel-CDN-Cache-Control': 'max-age=86400',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}
