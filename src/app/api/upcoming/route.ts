import { NextResponse } from 'next/server';
import { getUpcomingReleases } from '@/lib/omdb';

/**
 * 24-Hour High-Scale Edge Route for Upcoming Cinephile Releases.
 * Features:
 * - 0ms CDN Edge cache delivery (s-maxage=86400)
 * - Stale-While-Revalidate background regeneration
 * - 100,000 users = 1 OMDB fetch per day
 */
export const revalidate = 86400; // 24 hours in seconds

export async function GET() {
  try {
    const items = await getUpcomingReleases();

    return NextResponse.json(
      {
        success: true,
        count: items.length,
        updatedAt: new Date().toISOString(),
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
      {
        success: false,
        error: 'Failed to fetch upcoming calendar',
      },
      { status: 500 }
    );
  }
}
