import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Render only what the caller actually provides — fabricated years,
    // ratings and director names on social cards are mock data too.
    const title = searchParams.get('title') || 'İsimsiz Yapım';
    const year = searchParams.get('year');
    const director = searchParams.get('director');
    const rating = searchParams.get('rating');
    const genres = (searchParams.get('genres')?.split(',').filter(Boolean) || []).slice(0, 3);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0A0A0A',
            padding: '60px',
            fontFamily: 'monospace',
            border: '12px solid #171717',
          }}
        >
          {/* Header Strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '4px solid #404040',
              paddingBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  padding: '8px 20px',
                  fontSize: '20px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                }}
              >
                İZLEDİN.COM
              </div>
              <span style={{ color: '#D4D4D4', fontSize: '18px', fontWeight: 700 }}>
                35MM SİNEFİL ARŞİVİ
              </span>
            </div>
            {rating ? (
              <div
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#0A0A0A',
                  padding: '6px 16px',
                  fontSize: '16px',
                  fontWeight: 900,
                }}
              >
                ★ {rating} IMDB PUANI
              </div>
            ) : null}
          </div>

          {/* Body Content */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px' }}>
              <div style={{ color: '#DC2626', fontSize: '22px', fontWeight: 900, letterSpacing: '1px' }}>
                {[year, director ? `YÖNETMEN: ${director.toUpperCase()}` : null].filter(Boolean).join(' • ')}
              </div>
              <div
                style={{
                  color: '#FAFAFA',
                  fontSize: '52px',
                  fontWeight: 900,
                  fontFamily: 'sans-serif',
                  lineHeight: 1.1,
                }}
              >
                {title}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                {genres.slice(0, 3).map((g, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#171717',
                      color: '#FAFAFA',
                      border: '2px solid #404040',
                      padding: '6px 16px',
                      fontSize: '16px',
                      fontWeight: 800,
                    }}
                  >
                    #{g}
                  </div>
                ))}
              </div>
            </div>

            {/* Stamp Seal */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#171717',
                border: '4px solid #F59E0B',
                padding: '24px 32px',
                boxShadow: '6px 6px 0px #F59E0B',
              }}
            >
              <span style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 900 }}>KULÜP SEÇKİSİ</span>
              <span style={{ color: '#FAFAFA', fontSize: '32px', fontWeight: 900, fontFamily: 'sans-serif' }}>
                35MM
              </span>
              <span style={{ color: '#A3A3A3', fontSize: '12px', fontWeight: 700 }}>
                RESMİ ARŞİV
              </span>
            </div>
          </div>

          {/* Footer Masthead */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '2px solid #262626',
              paddingTop: '20px',
              color: '#737373',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            <span>Daktilo günlüğüne kaydet • Aynı zevke sahip İzdaşlar ile eşleş</span>
            <span style={{ color: '#FAFAFA' }}>izledin.com</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response('Failed to generate movie OG image', { status: 500 });
  }
}
