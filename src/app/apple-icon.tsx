import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0a2342',
          borderRadius: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          fontWeight: 900,
          fontSize: 72,
          letterSpacing: '-2px',
        }}
      >
        <span style={{ color: '#ffffff' }}>N</span>
        <span style={{ color: '#ff7b00' }}>3D</span>
      </div>
    ),
    { ...size }
  );
}
