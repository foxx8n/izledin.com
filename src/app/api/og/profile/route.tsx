import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'sinefil';
    const fullName = searchParams.get('name') || 'Sinefil Üye';
    const location = searchParams.get('location') || 'İstanbul';
    const genres = searchParams.get('genres')?.split(',') || ['Bilim Kurgu', 'Psikolojik Gerilim', 'Anime'];
    const score = searchParams.get('score') || '92';
    const watchCount = searchParams.get('count') || '148';

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
                35MM SİNEMA PASAPORTU
              </span>
            </div>
            <div
              style={{
                backgroundColor: '#F59E0B',
                color: '#0A0A0A',
                padding: '6px 16px',
                fontSize: '16px',
                fontWeight: 900,
              }}
            >
              EST. &apos;26 • RESMİ ÜYE
            </div>
          </div>

          {/* Body Content */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
              <div style={{ color: '#DC2626', fontSize: '22px', fontWeight: 900, letterSpacing: '1px' }}>
                @{username.toUpperCase()} • {location.toUpperCase()}
              </div>
              <div
                style={{
                  color: '#FAFAFA',
                  fontSize: '48px',
                  fontWeight: 900,
                  fontFamily: 'sans-serif',
                  lineHeight: 1.1,
                }}
              >
                {fullName}
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

            {/* Score Stamp Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#171717',
                border: '4px solid #DC2626',
                padding: '30px 40px',
                boxShadow: '8px 8px 0px #DC2626',
              }}
            >
              <span style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 900 }}>SİNEMA DNA UYUMU</span>
              <span style={{ color: '#FAFAFA', fontSize: '64px', fontWeight: 900, fontFamily: 'sans-serif' }}>
                %{score}
              </span>
              <span style={{ color: '#A3A3A3', fontSize: '14px', fontWeight: 700 }}>
                {watchCount} FİLM GÜNLÜKTE
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
            <span>BAĞIMSIZ SİNEFİL KULÜBÜ VE İZDAŞ EŞLEŞME PLATFORMU</span>
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
    return new Response('Failed to generate profile OG image', { status: 500 });
  }
}
