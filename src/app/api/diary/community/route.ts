import { NextRequest, NextResponse } from 'next/server';
import { getCommunityWatchLogs, CommunitySortMode } from '@/lib/services/watch-logs.service';

export const revalidate = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 200);
    const rawRating = parseFloat(searchParams.get('minRating') || '0');
    const minRating = isNaN(rawRating) ? 0 : Math.min(Math.max(rawRating, 0), 10);
    const sort = (searchParams.get('sort') || 'trending') as CommunitySortMode;

    const logs = await getCommunityWatchLogs(limit, minRating, sort);

    return NextResponse.json(
      {
        success: true,
        count: logs.length,
        logs,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=1800',
          'CDN-Cache-Control': 'max-age=300',
          'Vercel-CDN-Cache-Control': 'max-age=300',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch community watch logs' },
      { status: 500 }
    );
  }
}
