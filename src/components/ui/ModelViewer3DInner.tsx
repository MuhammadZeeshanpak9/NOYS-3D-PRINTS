'use client';

import React, { Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html, useProgress, Environment, Lightformer } from '@react-three/drei';

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
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
          {Math.round(progress)}%
        </span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Html>
  );
}

const GREY_MATERIAL = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#808080'),
  roughness: 0.5, // low enough that the studio env reflections read on the surface
  metalness: 0.0,
});

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = GREY_MATERIAL;
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

// Catches errors from useGLTF / Environment so a broken or expired
// model URL doesn't take down the whole page.
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
    <div style={{ width: '100%', height: '100%', minHeight: 380, background: '#c8c8c8', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative' }}>
      <ModelErrorBoundary fallback={<FallbackOverlay poster={poster} />}>
        <Canvas
          camera={{ position: [0, 0.5, 3], fov: 45 }}
          dpr={[1, 2]}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        >
          {/* Procedural studio environment. The old preset="studio" HDR file
              crashed mobile WebGL (multi-MB float-texture download), so the
              env map is instead generated in-GPU from a few soft Lightformer
              panels at a capped 256px resolution — no network fetch, tiny
              memory footprint, but restores the studio-style gradient shading
              the flat ambient/directional rig lost. dpr stays capped for
              high-DPR phones. */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <Environment resolution={256} frames={1}>
            {/* overhead key */}
            <Lightformer form="rect" intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
            {/* left / right rims */}
            <Lightformer form="rect" intensity={2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
            <Lightformer form="rect" intensity={2} position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
            {/* soft front fill */}
            <Lightformer form="rect" intensity={1} position={[0, 1, 5]} scale={[10, 5, 1]} />
          </Environment>

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
