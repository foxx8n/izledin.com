import { NextResponse } from 'next/server';
import { getMasterpieceOfTheWeekSync } from '@/lib/omdb';
import { getWeeklyFeaturedMasterpiece } from '@/lib/services/watch-logs.service';

export const revalidate = 86400; // Daily revalidation

export async function GET() {
  try {
    const item = await getWeeklyFeaturedMasterpiece();

    return NextResponse.json(
      {
        success: true,
        masterpiece: item || getMasterpieceOfTheWeekSync(),
        updatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
          'CDN-Cache-Control': 'max-age=604800',
          'Vercel-CDN-Cache-Control': 'max-age=604800',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: true,
        masterpiece: getMasterpieceOfTheWeekSync(),
      },
      { status: 200 }
    );
  }
}
