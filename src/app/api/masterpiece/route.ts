import { NextResponse } from 'next/server';
import { getMasterpieceOfTheWeek, getMasterpieceOfTheWeekSync } from '@/lib/omdb';

export const revalidate = 604800; // 7 days (Weekly cycle)

export async function GET() {
  try {
    const item = await getMasterpieceOfTheWeek();

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
