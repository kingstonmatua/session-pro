import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name       = searchParams.get('name')       ?? 'SessionPro';
  const discipline = searchParams.get('discipline')  ?? '';
  const location   = searchParams.get('location')   ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#059669',
          padding: '64px',
        }}
      >
        {/* Brand label */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: '0.12em',
            marginBottom: 32,
          }}
        >
          SESSIONPRO
        </div>

        {/* Pro name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {name}
        </div>

        {/* Discipline + location */}
        {(discipline || location) && (
          <div
            style={{
              fontSize: 30,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            {[discipline, location].filter(Boolean).join(' · ')}
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            width: 48,
            height: 2,
            backgroundColor: 'rgba(255,255,255,0.3)',
            marginTop: 40,
            marginBottom: 24,
          }}
        />

        {/* CTA */}
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>
          sessionpro.io
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
