'use client';

import React, { Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html, useProgress } from '@react-three/drei';

interface Props {
  src: string;
  poster?: string;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(100,130,200,0.3)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 11, color: '#a8b3c4', fontWeight: 600 }}>
          {Math.round(progress)}%
        </span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Html>
  );
}

// Matcap ("material capture") shading: the studio-sphere lighting is baked
// into a small texture and sampled by view-space normal — the same technique
// ZBrush/Sketchfab use for grey-clay sculpt previews. It needs no lights or
// environment map (the crash risk on mobile GPUs that forced the flat-light
// rig), costs almost nothing, and renders identically on every device. The
// texture is drawn once on a 2D canvas at runtime, so there is no asset to
// download either.
function createClayMatcap(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base sphere shading, key light from the upper-left. Mid-grey core with a
  // deep falloff — a near-white core bleached fine surface detail, so the
  // range is kept darker with more contrast, like sculpt-studio clay.
  const base = ctx.createRadialGradient(96, 88, 10, 128, 128, 128);
  base.addColorStop(0, '#e2e2e2');
  base.addColorStop(0.4, '#a8a8a8');
  base.addColorStop(0.75, '#6e6e6e');
  base.addColorStop(1, '#2e2e2e');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Soft specular highlight inside the key light — kept subtle so raised
  // detail brightens without blowing out to flat white.
  const spec = ctx.createRadialGradient(88, 78, 2, 88, 78, 38);
  spec.addColorStop(0, 'rgba(255,255,255,0.45)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.fillRect(0, 0, size, size);

  // Faint bounce light on the opposite rim so shadow sides don't go dead.
  const rim = ctx.createRadialGradient(176, 176, 60, 176, 176, 122);
  rim.addColorStop(0, 'rgba(255,255,255,0)');
  rim.addColorStop(0.82, 'rgba(255,255,255,0)');
  rim.addColorStop(1, 'rgba(255,255,255,0.16)');
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let clayMaterial: THREE.MeshMatcapMaterial | null = null;
function getClayMaterial(): THREE.MeshMatcapMaterial {
  if (!clayMaterial) {
    clayMaterial = new THREE.MeshMatcapMaterial({ matcap: createClayMatcap() });
    // Skip ACES tone mapping so the matcap's designed contrast isn't compressed.
    clayMaterial.toneMapped = false;
  }
  return clayMaterial;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = getClayMaterial();
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  }, [scene]);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

// Catches errors from useGLTF so a broken or expired model URL
// doesn't take down the whole page.
class ModelErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[ModelViewer3D] failed to render 3D model:', error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function FallbackOverlay({ poster }: { poster?: string }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: 24, textAlign: 'center',
      background: poster ? '#0f172a' : '#f3f4f6',
    }}>
      {poster ? (
        <img
          src={poster}
          alt="Preview"
          style={{ maxWidth: '100%', maxHeight: '70%', objectFit: 'contain', borderRadius: 8, opacity: 0.9, filter: 'grayscale(100%)' }}
        />
      ) : null}
      <p style={{ fontSize: 13, color: poster ? 'rgba(255,255,255,0.75)' : '#64748b', fontWeight: 600, margin: 0 }}>
        {poster ? 'Showing preview image' : '3D model could not be displayed'}
      </p>
      <p style={{ fontSize: 11, color: poster ? 'rgba(255,255,255,0.55)' : '#94a3b8', margin: 0 }}>
        This device may not support the interactive 3D view — try a different browser or a desktop.
      </p>
    </div>
  );
}

export function ModelViewer3DInner({ src, poster }: Props) {
  return (
    // Dark studio backdrop — grey clay pops against it the way Tripo's and
    // Meshy's own viewers present sculpts; the old light-grey background
    // washed the model out.
    <div style={{ width: '100%', height: '100%', minHeight: 380, background: 'radial-gradient(ellipse at 50% 40%, #3a3d42 0%, #232529 70%, #1b1d20 100%)', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative' }}>
      <ModelErrorBoundary fallback={<FallbackOverlay poster={poster} />}>
        <Canvas
          camera={{ position: [0, 0.5, 3], fov: 45 }}
          dpr={[1, 2]}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        >
          {/* No scene lights: the matcap material bakes its own studio
              lighting, so lights/environment maps (the thing that used to
              crash mobile GPUs) are unnecessary. dpr stays capped for
              high-DPR phones. */}
          <Suspense fallback={<Loader />}>
            <Model url={src} />
          </Suspense>

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            autoRotate
            autoRotateSpeed={1.5}
            minDistance={0.5}
            maxDistance={15}
            makeDefault
          />
        </Canvas>
      </ModelErrorBoundary>
    </div>
  );
}
