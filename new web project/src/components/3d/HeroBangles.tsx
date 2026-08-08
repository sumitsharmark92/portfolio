"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* ═══════════════════════════════════════════════════════════
   HeroBangles — Decorative floating bangles for the hero scene
   ═══════════════════════════════════════════════════════════ */

interface FloatingBangle {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  metalness: number;
  roughness: number;
  speed: number;
  phase: number;
}

export default function HeroBangles() {
  const groupRef = useRef<THREE.Group>(null);

  const bangles = useMemo<FloatingBangle[]>(
    () => [
      // Large gold kangan - center focus
      {
        position: [0, 0, 0],
        rotation: [Math.PI / 2, 0, 0],
        scale: 1.2,
        color: "#FFD700",
        metalness: 1,
        roughness: 0.12,
        speed: 0.3,
        phase: 0,
      },
      // Glass chudi - red
      {
        position: [-0.5, 0.3, -0.2],
        rotation: [Math.PI / 2, 0.2, 0.1],
        scale: 0.95,
        color: "#E63946",
        metalness: 0.0,
        roughness: 0.05,
        speed: 0.4,
        phase: 1,
      },
      // Kundan - warm gold
      {
        position: [0.6, -0.2, 0.3],
        rotation: [Math.PI / 2.2, -0.15, 0],
        scale: 1.05,
        color: "#E8C547",
        metalness: 0.9,
        roughness: 0.2,
        speed: 0.35,
        phase: 2,
      },
      // Glass chudi - emerald
      {
        position: [-0.3, -0.4, 0.5],
        rotation: [Math.PI / 1.9, 0.3, -0.1],
        scale: 0.85,
        color: "#065F46",
        metalness: 0.0,
        roughness: 0.05,
        speed: 0.45,
        phase: 3,
      },
      // Pearl bangle
      {
        position: [0.4, 0.5, -0.3],
        rotation: [Math.PI / 2.1, -0.1, 0.2],
        scale: 0.9,
        color: "#FFF8DC",
        metalness: 0.1,
        roughness: 0.3,
        speed: 0.38,
        phase: 4,
      },
      // Brass bangle
      {
        position: [-0.7, 0.1, 0.1],
        rotation: [Math.PI / 2, 0.1, -0.2],
        scale: 0.88,
        color: "#B5A642",
        metalness: 0.85,
        roughness: 0.35,
        speed: 0.42,
        phase: 5,
      },
    ],
    []
  );

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {bangles.map((b, i) => (
        <FloatingBangleMesh key={i} config={b} index={i} />
      ))}
    </group>
  );
}

function FloatingBangleMesh({
  config,
  index,
}: {
  config: FloatingBangle;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Floating animation
    meshRef.current.position.y =
      config.position[1] + Math.sin(t * config.speed + config.phase) * 0.15;
    meshRef.current.position.x =
      config.position[0] +
      Math.sin(t * config.speed * 0.5 + config.phase) * 0.05;

    // Subtle rotation
    meshRef.current.rotation.z = config.rotation[2] + Math.sin(t * 0.3 + index) * 0.05;
  });

  const isGlass = config.metalness === 0;

  return (
    <mesh
      ref={meshRef}
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
      castShadow
    >
      <torusGeometry args={[1.0, isGlass ? 0.06 : 0.08, 48, 64]} />
      {isGlass ? (
        <meshPhysicalMaterial
          color={config.color}
          transmission={0.9}
          roughness={0.05}
          thickness={1.5}
          ior={1.52}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1.5}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      ) : (
        <meshStandardMaterial
          color={config.color}
          metalness={config.metalness}
          roughness={config.roughness}
          envMapIntensity={1.5}
        />
      )}
    </mesh>
  );
}
