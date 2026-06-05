import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const appUrl = new URL(request.url).origin;
  const logoSrc = `${appUrl}/images/logo-nav.png`;

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
          backgroundColor: '#ffffff',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={520} height={154} />
        <div
          style={{
            fontSize: 26,
            color: '#6b7280',
            marginTop: 40,
            letterSpacing: '0.01em',
          }}
        >
          Book and manage sessions — all in one place.
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
