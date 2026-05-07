'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center, Html, useProgress } from '@react-three/drei';

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

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

export function ModelViewer3DInner({ src }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 380, background: '#f3f4f6', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0.5, 3], fov: 45 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, 3, -3]} intensity={0.4} />

        <Suspense fallback={<Loader />}>
          <Model url={src} />
          <Environment preset="studio" />
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
    </div>
  );
}
