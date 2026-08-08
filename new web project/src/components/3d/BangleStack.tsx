"use client";

import { useCustomizerStore } from "@/store/customizer";
import BangleMesh from "./BangleMesh";
import WristModel from "./WristModel";

/* ═══════════════════════════════════════════════════════════
   BangleStack Component
   Renders the full bangle stack from Zustand store
   Handles selection, exploded view, and wrist reference
   ═══════════════════════════════════════════════════════════ */

export default function BangleStack() {
  const stack = useCustomizerStore((s) => s.stack);
  const selectedIndex = useCustomizerStore((s) => s.selectedIndex);
  const isExplodedView = useCustomizerStore((s) => s.isExplodedView);
  const wristSize = useCustomizerStore((s) => s.wristSize);
  const selectBangle = useCustomizerStore((s) => s.selectBangle);

  return (
    <group>
      {/* Wrist reference cylinder */}
      <WristModel size={wristSize} visible={stack.length > 0} />

      {/* Render each bangle in the stack */}
      {stack.map((bangle, index) => (
        <BangleMesh
          key={bangle.id}
          bangle={bangle}
          index={index}
          isSelected={selectedIndex === index}
          isExploded={isExplodedView}
          stackLength={stack.length}
          onClick={() => selectBangle(index)}
        />
      ))}

      {/* Empty state: show a single ghost bangle */}
      {stack.length === 0 && <GhostBangle />}
    </group>
  );
}

/* ─── Ghost Bangle (Empty State) ─── */
function GhostBangle() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.0, 0.07, 32, 64]} />
      <meshStandardMaterial
        color="#D4AF37"
        metalness={0.8}
        roughness={0.3}
        transparent
        opacity={0.2}
        wireframe
      />
    </mesh>
  );
}
