"use client";

import { useCustomizerStore, type LightingPreset } from "@/store/customizer";
import { Environment, Lightformer } from "@react-three/drei";

/* ═══════════════════════════════════════════════════════════
   Lighting Presets Component
   Procedural 3D studio environments using Drei Lightformers
   100% offline-compatible, high-fidelity PBR reflections
   ═══════════════════════════════════════════════════════════ */

interface LightConfig {
  ambientIntensity: number;
  ambientColor: string;
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: [number, number, number];
  fillLightIntensity: number;
  fillLightColor: string;
  fillLightPosition: [number, number, number];
  rimLightIntensity: number;
  rimLightColor: string;
  rimLightPosition: [number, number, number];
  accentColor: string;
}

const LIGHT_CONFIGS: Record<LightingPreset, LightConfig> = {
  royal: {
    ambientIntensity: 0.5,
    ambientColor: "#FFE4B5",
    directionalIntensity: 2.0,
    directionalColor: "#FFD700",
    directionalPosition: [5, 8, 3],
    fillLightIntensity: 0.8,
    fillLightColor: "#FF9F43",
    fillLightPosition: [-4, 3, -2],
    rimLightIntensity: 1.0,
    rimLightColor: "#D4AF37",
    rimLightPosition: [-2, 5, -5],
    accentColor: "#FFD700",
  },
  "golden-hour": {
    ambientIntensity: 0.4,
    ambientColor: "#FF8C42",
    directionalIntensity: 2.2,
    directionalColor: "#FF6B35",
    directionalPosition: [3, 4, 8],
    fillLightIntensity: 0.7,
    fillLightColor: "#FFB347",
    fillLightPosition: [-5, 2, 3],
    rimLightIntensity: 0.9,
    rimLightColor: "#FF4500",
    rimLightPosition: [0, 6, -4],
    accentColor: "#FF7700",
  },
  studio: {
    ambientIntensity: 0.6,
    ambientColor: "#FFFFFF",
    directionalIntensity: 1.8,
    directionalColor: "#F5F5F5",
    directionalPosition: [5, 10, 5],
    fillLightIntensity: 0.9,
    fillLightColor: "#F0F0F0",
    fillLightPosition: [-5, 5, 5],
    rimLightIntensity: 0.7,
    rimLightColor: "#E0E0E0",
    rimLightPosition: [0, 3, -6],
    accentColor: "#FFFFFF",
  },
  festive: {
    ambientIntensity: 0.4,
    ambientColor: "#FF6B6B",
    directionalIntensity: 1.5,
    directionalColor: "#FFD93D",
    directionalPosition: [4, 6, 2],
    fillLightIntensity: 0.6,
    fillLightColor: "#FF4757",
    fillLightPosition: [-3, 4, -3],
    rimLightIntensity: 1.2,
    rimLightColor: "#FF6348",
    rimLightPosition: [2, 2, -5],
    accentColor: "#FF4757",
  },
};

export default function LightingPresets() {
  const preset = useCustomizerStore((s) => s.lightingPreset);
  const config = LIGHT_CONFIGS[preset];

  return (
    <>
      {/* Procedural HDR reflections via Lightformers — zero external assets needed */}
      <Environment resolution={256}>
        {/* Overhead softbox */}
        <Lightformer
          form="rect"
          intensity={1.5}
          color={config.directionalColor}
          position={[0, 5, -2]}
          scale={[10, 5, 1]}
          target={[0, 0, 0]}
        />
        {/* Key light reflection */}
        <Lightformer
          form="ring"
          intensity={2.0}
          color={config.accentColor}
          position={[4, 2, 4]}
          scale={[4, 4, 1]}
          target={[0, 0, 0]}
        />
        {/* Side fill reflection */}
        <Lightformer
          form="rect"
          intensity={1.0}
          color={config.fillLightColor}
          position={[-5, 1, 2]}
          scale={[6, 6, 1]}
          target={[0, 0, 0]}
        />
        {/* Rim highlight */}
        <Lightformer
          form="circle"
          intensity={1.2}
          color={config.rimLightColor}
          position={[0, -2, -4]}
          scale={[3, 3, 1]}
          target={[0, 0, 0]}
        />
      </Environment>

      {/* Direct lighting */}
      <ambientLight
        intensity={config.ambientIntensity}
        color={config.ambientColor}
      />

      <directionalLight
        intensity={config.directionalIntensity}
        color={config.directionalColor}
        position={config.directionalPosition}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      <pointLight
        intensity={config.fillLightIntensity}
        color={config.fillLightColor}
        position={config.fillLightPosition}
        distance={15}
        decay={2}
      />

      <pointLight
        intensity={config.rimLightIntensity}
        color={config.rimLightColor}
        position={config.rimLightPosition}
        distance={12}
        decay={2}
      />

      {/* Additional festive point lights */}
      {preset === "festive" && (
        <>
          <pointLight
            intensity={0.4}
            color="#00FF88"
            position={[3, 1, 3]}
            distance={8}
            decay={2}
          />
          <pointLight
            intensity={0.3}
            color="#FF1493"
            position={[-3, 0, 2]}
            distance={8}
            decay={2}
          />
        </>
      )}
    </>
  );
}

export { LIGHT_CONFIGS };
