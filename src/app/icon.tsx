import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0a2342',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          fontWeight: 900,
          fontSize: 13,
          letterSpacing: '-0.5px',
        }}
      >
        <span style={{ color: '#ffffff' }}>N</span>
        <span style={{ color: '#ff7b00' }}>3D</span>
      </div>
    ),
    { ...size }
  );
}
