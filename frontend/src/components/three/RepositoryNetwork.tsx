'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { REPOSITORIES, SCENE_COLORS } from '@/lib/constants';
import { scrollState } from '@/lib/animations';
import { IntelligenceCore } from './IntelligenceCore';
import { RepositoryNode } from './RepositoryNode';
import { ConnectionLines } from './ConnectionLines';
import { DataParticles } from './DataParticles';
import { createCodeFragmentTexture } from './textures';

/** Ambient code plates — depth detail that reinforces "this reads your source". */
const CODE_FRAGMENTS: { lines: string[]; position: [number, number, number]; rotation: number; scale: number }[] = [
  { lines: ['def score(repo):', '  return model.predict(', '    features(repo))'], position: [-6.6, -2.4, -6.5], rotation: 0.18, scale: 1 },
  { lines: ['async function scan() {', '  const repos = await gh.list()', '}'], position: [6.2, 2.8, -7.5], rotation: -0.22, scale: 1.1 },
  { lines: ['git commit -m "feat(search)"', '# awaiting approval'], position: [5.4, -3.2, -5.2], rotation: 0.12, scale: 0.9 },
];

/** Slow-moving technical floor grid, far behind the network. */
function BackgroundGrid({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.GridHelper>(null);

  const grid = useMemo(() => {
    const g = new THREE.GridHelper(60, 60, SCENE_COLORS.line, SCENE_COLORS.line);
    const m = g.material as THREE.Material;
    m.transparent = true;
    m.opacity = 0.05;
    m.depthWrite = false;
    return g;
  }, []);

  useEffect(() => {
    const g = grid;
    return () => {
      g.geometry.dispose();
      (g.material as THREE.Material).dispose();
    };
  }, [grid]);

  useFrame((state) => {
    if (reduced || !ref.current) return;
    // Creeping drift — one grid cell every ~8s. Barely perceptible by design.
    ref.current.position.z = ((state.clock.elapsedTime * 0.12) % 1) - 8;
  });

  return <primitive ref={ref} object={grid} position={[0, -5.5, -8]} rotation={[0, 0, 0]} />;
}

function CodeFragments() {
  const textures = useMemo(() => CODE_FRAGMENTS.map((f) => createCodeFragmentTexture(f.lines)), []);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  return (
    <>
      {CODE_FRAGMENTS.map((f, i) => (
        <mesh key={i} position={f.position} rotation={[0, f.rotation, 0]} scale={f.scale}>
          <planeGeometry args={[2.2, 1.1]} />
          <meshBasicMaterial map={textures[i]} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/**
 * The full GitHub ecosystem: intelligence core at the centre, repository nodes
 * orbiting it, links and travelling data between them.
 *
 * `emphasised` is derived from scroll progress rather than React state — during
 * the priority beat (roughly the middle of the page) the high scorers brighten,
 * matching the ranking section being read alongside it.
 */
export function RepositoryNetwork({ mobile = false, reduced = false }: { mobile?: boolean; reduced?: boolean }) {
  const emphasised = useRef(false);

  // On phones show only the core plus the three highest-priority repositories.
  const visible = mobile ? REPOSITORIES.slice(0, 3) : REPOSITORIES;

  useFrame(() => {
    const p = scrollState.progress;
    emphasised.current = p > 0.32 && p < 0.62;
  });

  return (
    <group>
      <IntelligenceCore reduced={reduced} />
      <ConnectionLines reduced={reduced} />
      <DataParticles mobile={mobile} reduced={reduced} />

      {visible.map((repo, i) => (
        <RepositoryNode
          key={repo.id}
          repo={repo}
          index={i}
          emphasised={repo.priority >= 80}
          reduced={reduced}
        />
      ))}

      {!mobile && <CodeFragments />}
      {!mobile && <BackgroundGrid reduced={reduced} />}
    </group>
  );
}
