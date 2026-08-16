'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Repository } from '@/lib/constants';
import { SCENE_COLORS } from '@/lib/constants';
import { createNodeTexture } from './textures';

interface RepositoryNodeProps {
  repo: Repository;
  index: number;
  /** True while the priority beat is on screen — brightens the highest scorers. */
  emphasised?: boolean;
  reduced?: boolean;
}

/**
 * One repository in the network: a small glass label panel plus a marker dot.
 *
 * Each node is given its own float period, amplitude and phase derived from its
 * index, so the constellation never pulses in unison — synchronised floating is
 * the fastest way to make a scene read as generated rather than composed.
 *
 * Panels always face the camera (billboarded) so labels stay legible from every
 * point along the camera path.
 */
export function RepositoryNode({ repo, index, emphasised = false, reduced = false }: RepositoryNodeProps) {
  const group = useRef<THREE.Group>(null);
  const dot = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => createNodeTexture(repo.name, repo.priority, repo.priority >= 80), [repo.name, repo.priority]);
  useEffect(() => () => texture.dispose(), [texture]);

  // Per-node motion signature — irrational multipliers avoid visible cycles.
  const motion = useMemo(
    () => ({
      period: 5.2 + index * 1.37,
      amplitude: 0.1 + (index % 3) * 0.045,
      drift: 0.05 + (index % 2) * 0.03,
      phase: index * 1.9,
    }),
    [index]
  );

  const basePosition = useMemo(() => new THREE.Vector3(...repo.position), [repo.position]);

  useFrame((state) => {
    if (!group.current) return;

    if (!reduced) {
      const t = state.clock.elapsedTime;
      group.current.position.y =
        basePosition.y + Math.sin((t / motion.period) * Math.PI * 2 + motion.phase) * motion.amplitude;
      group.current.position.x =
        basePosition.x + Math.cos((t / (motion.period * 1.6)) * Math.PI * 2 + motion.phase) * motion.drift;
    }

    // Billboard toward the camera.
    group.current.quaternion.copy(state.camera.quaternion);

    if (dot.current) {
      const m = dot.current.material as THREE.MeshBasicMaterial;
      const target = emphasised ? 1 : 0.55;
      m.opacity += (target - m.opacity) * 0.06;
    }
  });

  const isHighPriority = repo.priority >= 80;
  const scale = 0.62 + (repo.priority / 100) * 0.18;

  return (
    <group ref={group} position={basePosition}>
      <mesh scale={[scale, scale, 1]}>
        <planeGeometry args={[2.0, 0.6]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>

      {/* Marker dot — sage for repositories that need attention. */}
      <mesh ref={dot} position={[-0.66 * scale, 0.26 * scale, 0.01]}>
        <circleGeometry args={[0.026, 16]} />
        <meshBasicMaterial
          color={isHighPriority ? SCENE_COLORS.glow : SCENE_COLORS.silver}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {isHighPriority && (
        <mesh position={[0, 0, -0.06]}>
          <circleGeometry args={[1.15 * scale, 40]} />
          <meshBasicMaterial color={SCENE_COLORS.sage} transparent opacity={0.045} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
