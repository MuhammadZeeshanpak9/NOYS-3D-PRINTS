'use client';

import dynamic from 'next/dynamic';

interface ModelViewer3DProps {
  src: string;
  poster?: string;
}

// Dynamically import the actual viewer — ssr:false prevents WebGL crashing on server
const ModelViewer3DInner = dynamic(
  () => import('./ModelViewer3DInner').then((m) => m.ModelViewer3DInner),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', minHeight: 380, background: '#f3f4f6', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    ),
  }
);

export function ModelViewer3D({ src, poster }: ModelViewer3DProps) {
  return <ModelViewer3DInner src={src} poster={poster} />;
}
