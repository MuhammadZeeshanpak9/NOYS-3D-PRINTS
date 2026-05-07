'use client';

import { useEffect, useRef } from 'react';

interface ModelViewer3DProps {
  src: string;
  poster?: string;
}

export function ModelViewer3D({ src, poster }: ModelViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mv: HTMLElement | null = null;

    // Import the library first, then create the element once it's registered
    import('@google/model-viewer')
      .then(() => {
        if (!container) return;
        mv = document.createElement('model-viewer');
        mv.setAttribute('src', src);
        if (poster) mv.setAttribute('poster', poster);
        mv.setAttribute('camera-controls', '');
        mv.setAttribute('auto-rotate', '');
        mv.setAttribute('auto-rotate-delay', '500');
        mv.setAttribute('shadow-intensity', '1');
        mv.setAttribute('interaction-prompt', 'auto');
        mv.setAttribute('loading', 'eager');
        mv.style.cssText = [
          'width:100%',
          'height:100%',
          'min-height:380px',
          'background:#f3f4f6',
          'border-radius:0.75rem',
          'touch-action:none',
          'outline:none',
          '--poster-color:#f3f4f6',
        ].join(';');
        container.appendChild(mv);
      })
      .catch(() => {});

    return () => {
      if (mv && container.contains(mv)) container.removeChild(mv);
    };
  }, [src, poster]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '380px',
        background: '#f3f4f6',
        borderRadius: '0.75rem',
      }}
    />
  );
}
