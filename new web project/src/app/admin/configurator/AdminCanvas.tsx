"use client";

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  ContactShadows,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

/* ═══════════════════════════════════════════════════════════
   AdminCanvas — 3D preview canvas for the material configurator
   Procedural environment map with zero remote asset dependency
   ═══════════════════════════════════════════════════════════ */

interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  ior: number;
  envMapIntensity: number;
  emissiveIntensity: number;
}

export default function AdminCanvas({ config }: { config: MaterialConfig }) {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        camera={{ position: [0, 1, 4], fov: 35 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.2 }}
      >
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer
              form="rect"
              intensity={2.0}
              color="#FFFFFF"
              position={[0, 5, -2]}
              scale={[10, 5, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="circle"
              intensity={1.5}
              color="#FFD700"
              position={[4, 2, 4]}
              scale={[4, 4, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={1.0}
              color="#E0E0E0"
              position={[-5, 1, 2]}
              scale={[6, 6, 1]}
              target={[0, 0, 0]}
            />
          </Environment>

          <ambientLight intensity={0.4} color="#FFFFFF" />
          <directionalLight
            intensity={1.8}
            color="#FFFFFF"
            position={[5, 8, 3]}
            castShadow
          />
          <pointLight intensity={0.6} color="#FFD700" position={[-3, 4, -2]} />

          <PreviewBangle config={config} />

          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.3}
            scale={8}
            blur={2}
            far={3}
            color="#D4AF37"
          />

          <OrbitControls
            autoRotate
            autoRotateSpeed={2}
            enablePan={false}
            minDistance={2}
            maxDistance={6}
            enableDamping
          />

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.9}
              luminanceSmoothing={0.5}
              intensity={0.3}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}

function PreviewBangle({ config }: { config: MaterialConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  const isTransmissive = config.transmission > 0.1;

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[1, 0.08, 64, 128]} />
      <meshPhysicalMaterial
        color={config.color}
        metalness={config.metalness}
        roughness={config.roughness}
        clearcoat={config.clearcoat}
        clearcoatRoughness={config.clearcoatRoughness}
        transmission={config.transmission}
        thickness={config.thickness}
        ior={config.ior}
        envMapIntensity={config.envMapIntensity}
        emissive={config.color}
        emissiveIntensity={config.emissiveIntensity}
        transparent={isTransmissive}
        side={isTransmissive ? THREE.DoubleSide : THREE.FrontSide}
      />
    </mesh>
  );
}
