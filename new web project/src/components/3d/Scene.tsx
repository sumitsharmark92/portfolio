"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  PerformanceMonitor,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useCustomizerStore } from "@/store/customizer";
import BangleStack from "./BangleStack";
import LightingPresets from "./LightingPresets";

/* ═══════════════════════════════════════════════════════════
   3D Scene Wrapper
   Main R3F Canvas with post-processing, controls, and shadows
   ═══════════════════════════════════════════════════════════ */

interface SceneProps {
  className?: string;
  showControls?: boolean;
  showPostProcessing?: boolean;
  cameraPosition?: [number, number, number];
  enableZoom?: boolean;
  minDistance?: number;
  maxDistance?: number;
}

export default function Scene({
  className = "",
  showControls = true,
  showPostProcessing = true,
  cameraPosition = [0, 1.5, 4],
  enableZoom = true,
  minDistance = 2,
  maxDistance = 8,
}: SceneProps) {
  const isAutoRotate = useCustomizerStore((s) => s.isAutoRotate);
  const dprRef = useRef<[number, number]>([1, 2]);

  return (
    <div className={`canvas-container ${className}`}>
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        shadows
        dpr={dprRef.current}
        gl={{
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1.2,
        }}
      >
        <Suspense fallback={null}>
          {/* Adaptive performance */}
          <PerformanceMonitor
            onDecline={() => {
              dprRef.current = [1, 1.5];
            }}
            onIncline={() => {
              dprRef.current = [1, 2];
            }}
          />

          {/* Lighting */}
          <LightingPresets />

          {/* Main bangle stack */}
          <BangleStack />

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -1.8, 0]}
            opacity={0.4}
            scale={10}
            blur={2.5}
            far={4}
            color="#D4AF37"
          />

          {/* Camera controls */}
          {showControls && (
            <OrbitControls
              makeDefault
              autoRotate={isAutoRotate}
              autoRotateSpeed={1.5}
              enableZoom={enableZoom}
              enablePan={false}
              minDistance={minDistance}
              maxDistance={maxDistance}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.5}
              dampingFactor={0.05}
              enableDamping
            />
          )}

          {/* Post-processing */}
          {showPostProcessing && (
            <EffectComposer>
              <Bloom
                luminanceThreshold={0.9}
                luminanceSmoothing={0.5}
                intensity={0.4}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
