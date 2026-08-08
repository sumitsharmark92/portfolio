"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* ═══════════════════════════════════════════════════════════
   Wrist Reference Model
   Subtle cylindrical wrist for spatial reference in the studio
   ═══════════════════════════════════════════════════════════ */

interface WristModelProps {
  size: string; // "2.2", "2.4", "2.6", "2.8", "2.10"
  visible?: boolean;
}

// Convert wrist size (inches of inner diameter) to scene scale
const SIZE_SCALES: Record<string, number> = {
  "2.2": 0.85,
  "2.4": 0.92,
  "2.6": 1.0,
  "2.8": 1.08,
  "2.10": 1.15,
};

export default function WristModel({ size, visible = true }: WristModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = SIZE_SCALES[size] || 1.0;

  useFrame(() => {
    if (meshRef.current) {
      // Very subtle breathing animation
      meshRef.current.scale.x = scale + Math.sin(Date.now() * 0.0005) * 0.003;
      meshRef.current.scale.z = scale + Math.sin(Date.now() * 0.0005) * 0.003;
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Main wrist cylinder */}
      <mesh ref={meshRef} scale={[scale, 1, scale]} castShadow={false}>
        <cylinderGeometry args={[0.72, 0.7, 3.5, 32, 1, true]} />
        <meshStandardMaterial
          color="#D4A574"
          roughness={0.8}
          metalness={0.0}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe overlay for sizing reference */}
      <mesh scale={[scale, 1, scale]}>
        <cylinderGeometry args={[0.73, 0.71, 3.5, 16, 4, true]} />
        <meshBasicMaterial
          color="#D4AF37"
          transparent
          opacity={0.06}
          wireframe
        />
      </mesh>
    </group>
  );
}
