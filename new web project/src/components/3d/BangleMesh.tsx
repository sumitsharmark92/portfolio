"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { BangleItem, BangleMaterialType } from "@/store/customizer";

/* ═══════════════════════════════════════════════════════════
   BangleMesh Component
   Procedural torus geometry with PBR material system
   Supports: Gold, Glass, Kundan, Pearl, Brass, Diamond
   ═══════════════════════════════════════════════════════════ */

interface BangleMeshProps {
  bangle: BangleItem;
  index: number;
  isSelected: boolean;
  isExploded: boolean;
  stackLength: number;
  onClick?: () => void;
}

// Spacing between bangles in the stack
const BANGLE_SPACING = 0.22;
const EXPLODED_SPACING = 0.65;

// Material-specific geometry variations
const GEOMETRY_CONFIGS: Record<
  BangleMaterialType,
  { outerRadius: number; tubeRadius: number; radialSegments: number; tubularSegments: number }
> = {
  gold: { outerRadius: 1.0, tubeRadius: 0.08, radialSegments: 64, tubularSegments: 32 },
  glass: { outerRadius: 1.0, tubeRadius: 0.06, radialSegments: 64, tubularSegments: 24 },
  kundan: { outerRadius: 1.0, tubeRadius: 0.1, radialSegments: 64, tubularSegments: 32 },
  pearl: { outerRadius: 1.0, tubeRadius: 0.07, radialSegments: 64, tubularSegments: 28 },
  brass: { outerRadius: 1.0, tubeRadius: 0.09, radialSegments: 64, tubularSegments: 30 },
  diamond: { outerRadius: 1.0, tubeRadius: 0.055, radialSegments: 128, tubularSegments: 48 },
};

export default function BangleMesh({
  bangle,
  index,
  isSelected,
  isExploded,
  stackLength,
  onClick,
}: BangleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate target Y position
  const spacing = isExploded ? EXPLODED_SPACING : BANGLE_SPACING;
  const totalHeight = (stackLength - 1) * spacing;
  const targetY = index * spacing - totalHeight / 2;

  // Procedural geometry
  const geoConfig = GEOMETRY_CONFIGS[bangle.material] || GEOMETRY_CONFIGS.gold;
  const geometry = useMemo(
    () =>
      new THREE.TorusGeometry(
        geoConfig.outerRadius * (bangle.outerRadius || 1),
        geoConfig.tubeRadius * (bangle.tubeRadius || 1),
        geoConfig.radialSegments,
        geoConfig.tubularSegments
      ),
    [bangle.outerRadius, bangle.tubeRadius, geoConfig]
  );

  // Animate position and selection highlight
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Smooth Y position interpolation
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetY,
      delta * 6
    );

    // Floating animation in exploded view
    if (isExploded) {
      meshRef.current.position.y +=
        Math.sin(Date.now() * 0.001 + index * 1.2) * 0.02;
    }

    // Selection glow scale
    const targetScale = isSelected ? 1.04 : 1.0;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta * 8)
    );
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, targetY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      castShadow
      receiveShadow
    >
      <BangleMaterial bangle={bangle} isSelected={isSelected} />
    </mesh>
  );
}

/* ─── Material Sub-Component ─── */
function BangleMaterial({
  bangle,
  isSelected,
}: {
  bangle: BangleItem;
  isSelected: boolean;
}) {
  const color = new THREE.Color(bangle.colorHex);

  // Common props
  const emissiveIntensity = isSelected ? 0.15 : 0;
  const emissiveColor = isSelected
    ? new THREE.Color("#D4AF37")
    : new THREE.Color("#000000");

  switch (bangle.material) {
    case "glass":
      return (
        <meshPhysicalMaterial
          color={color}
          transmission={bangle.transmission || 0.95}
          roughness={bangle.roughness || 0.05}
          thickness={bangle.thickness || 1.5}
          ior={bangle.ior || 1.52}
          clearcoat={bangle.clearcoat || 1.0}
          clearcoatRoughness={0.1}
          envMapIntensity={1.5}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      );

    case "diamond":
      return (
        <meshPhysicalMaterial
          color={color}
          transmission={bangle.transmission || 0.95}
          roughness={bangle.roughness || 0.02}
          thickness={bangle.thickness || 0.8}
          ior={bangle.ior || 2.42}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          envMapIntensity={2.5}
          transparent
          attenuationColor={new THREE.Color("#B9F2FF")}
          attenuationDistance={0.5}
          side={THREE.DoubleSide}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      );

    case "pearl":
      return (
        <meshPhysicalMaterial
          color={color}
          metalness={bangle.metalness || 0.1}
          roughness={bangle.roughness || 0.3}
          clearcoat={bangle.clearcoat || 0.8}
          clearcoatRoughness={0.15}
          iridescence={1.0}
          iridescenceIOR={1.3}
          sheen={1.0}
          sheenColor={new THREE.Color("#FFF8DC")}
          sheenRoughness={0.3}
          envMapIntensity={1.2}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      );

    case "kundan":
      return (
        <meshPhysicalMaterial
          color={color}
          metalness={bangle.metalness || 0.9}
          roughness={bangle.roughness || 0.2}
          clearcoat={bangle.clearcoat || 1.0}
          clearcoatRoughness={0.05}
          envMapIntensity={1.8}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity + 0.05}
        />
      );

    case "brass":
      return (
        <meshStandardMaterial
          color={color}
          metalness={bangle.metalness || 0.85}
          roughness={bangle.roughness || 0.35}
          envMapIntensity={1.0}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      );

    case "gold":
    default:
      return (
        <meshStandardMaterial
          color={color}
          metalness={bangle.metalness || 1.0}
          roughness={bangle.roughness || 0.15}
          envMapIntensity={1.5}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      );
  }
}
