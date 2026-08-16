'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENE_COLORS } from '@/lib/constants';
import { createCorePanelTexture } from './textures';

/**
 * The Git AI intelligence core: a metallic-glass panel showing the current
 * recommendation, wrapped in two counter-rotating technical rings.
 *
 * Read as a piece of instrumentation, not a sci-fi artefact — the rings are
 * thin, the pulse is slow, and the emissive level stays low enough that the
 * panel text remains the brightest thing in frame.
 */
export function IntelligenceCore({ reduced = false }: { reduced?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  const panelTexture = useMemo(() => createCorePanelTexture(), []);

  // Canvas textures hold a GPU allocation; release it when the core unmounts.
  useEffect(() => () => panelTexture.dispose(), [panelTexture]);

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;

    // Slow breathing — a 9s cycle, ±1.5% scale. Deliberately near-subliminal.
    if (group.current) {
      const breathe = 1 + Math.sin(t * 0.7) * 0.015;
      group.current.scale.setScalar(breathe);
      group.current.position.y = Math.sin(t * 0.45) * 0.06;
    }

    if (ringA.current) ringA.current.rotation.z = t * 0.08;
    if (ringB.current) ringB.current.rotation.z = -t * 0.055;

    // The halo pulses out of phase with the body for a layered feel.
    if (halo.current) {
      const m = halo.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.055 + Math.sin(t * 0.7 + 1.2) * 0.025;
    }
  });

  return (
    <group ref={group}>
      {/* Recommendation panel — 16:10, sized to read from the wide beat. */}
      <mesh>
        <planeGeometry args={[3.2, 2.0]} />
        <meshBasicMaterial map={panelTexture} transparent toneMapped={false} />
      </mesh>

      {/* Thin metallic bezel behind the panel, catching the key light. */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[3.32, 2.12]} />
        <meshStandardMaterial
          color="#161b16"
          metalness={0.85}
          roughness={0.28}
          emissive={SCENE_COLORS.sage}
          emissiveIntensity={0.045}
        />
      </mesh>

      {/* Technical rings */}
      <mesh ref={ringA} position={[0, 0, -0.12]}>
        <ringGeometry args={[2.45, 2.462, 96]} />
        <meshBasicMaterial color={SCENE_COLORS.line} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringB} position={[0, 0, -0.18]} rotation={[0, 0, Math.PI / 6]}>
        <ringGeometry args={[2.9, 2.908, 96]} />
        <meshBasicMaterial color={SCENE_COLORS.line} transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>

      {/* Soft volumetric bloom standing in for a lit enclosure. */}
      <mesh ref={halo} position={[0, 0, -0.5]}>
        <circleGeometry args={[4.2, 64]} />
        <meshBasicMaterial color={SCENE_COLORS.glow} transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* Local key light so the bezel reads as metal rather than flat colour. */}
      <pointLight position={[0.6, 0.8, 1.6]} intensity={2.4} color={SCENE_COLORS.glow} distance={9} decay={2} />
    </group>
  );
}
