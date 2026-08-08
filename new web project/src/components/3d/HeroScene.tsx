"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import HeroBangles from "./HeroBangles";

/* ═══════════════════════════════════════════════════════════
   HeroScene — Cinematic 3D scene for the homepage hero
   Procedural environment lighting with zero remote dependencies
   ═══════════════════════════════════════════════════════════ */

export default function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{
          position: [0, 0.5, 5],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.3,
        }}
      >
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer
              form="rect"
              intensity={2.0}
              color="#FFD700"
              position={[3, 5, 2]}
              scale={[8, 4, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="circle"
              intensity={1.5}
              color="#FFE4B5"
              position={[-4, 2, 3]}
              scale={[5, 5, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="ring"
              intensity={1.0}
              color="#FF6B35"
              position={[0, -3, -3]}
              scale={[4, 4, 1]}
              target={[0, 0, 0]}
            />
          </Environment>

          <ambientLight intensity={0.4} color="#FFE4B5" />
          <directionalLight
            intensity={2.0}
            color="#FFD700"
            position={[5, 8, 3]}
            castShadow
          />
          <pointLight
            intensity={0.8}
            color="#FF9F43"
            position={[-4, 3, -2]}
            distance={15}
          />
          <pointLight
            intensity={0.5}
            color="#D4AF37"
            position={[-2, 5, -5]}
            distance={12}
          />

          <HeroBangles />

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.3}
            scale={12}
            blur={3}
            far={4}
            color="#D4AF37"
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.8}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2}
            enableDamping
            dampingFactor={0.05}
          />

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.8}
              luminanceSmoothing={0.6}
              intensity={0.5}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
