'use client';

import { useEffect, useRef } from 'react';

interface ModelViewer3DProps {
  src: string;
  poster?: string;
}

export function ModelViewer3D({ src, poster }: ModelViewer3DProps) {
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      import('@google/model-viewer').catch(() => {});
    }
  }, []);

  // Cast to any — model-viewer is a web component, not a known HTML element
  const MV = 'model-viewer' as any;

  return (
    <MV
      src={src}
      poster={poster}
      camera-controls=""
      auto-rotate=""
      auto-rotate-delay="0"
      rotation-per-second="30deg"
      shadow-intensity="1"
      interaction-prompt="auto"
      loading="eager"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '380px',
        background: '#f3f4f6',
        borderRadius: '0.75rem',
        touchAction: 'none',
        outline: 'none',
      }}
    />
  );
}
