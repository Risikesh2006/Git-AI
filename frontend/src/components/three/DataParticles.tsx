'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENE_COLORS } from '@/lib/constants';
import { LINK_CURVES } from './ConnectionLines';

/**
 * Two particle systems, both single draw calls:
 *
 *  1. `FlowParticles` — points that travel each link from repository to core,
 *     representing analysis being pulled in. Direction matters: they always
 *     move inward, never outward, because that is the direction data flows.
 *
 *  2. `AmbientDust` — motionless depth cues scattered through the volume at
 *     several distances, which gives the parallax something to act on.
 *
 * Positions are written straight into a Float32 attribute buffer each frame,
 * so neither system allocates during the render loop.
 */

const PER_LINK_DESKTOP = 7;
const PER_LINK_MOBILE = 3;

function FlowParticles({ perLink, reduced }: { perLink: number; reduced: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const total = LINK_CURVES.length * perLink;

  // Each particle keeps its own offset along the curve and speed.
  const seeds = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => ({
        link: Math.floor(i / perLink),
        offset: (i % perLink) / perLink,
        speed: 0.055 + ((i * 37) % 10) / 320,
      })),
    [total, perLink]
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
    return g;
  }, [total]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: SCENE_COLORS.glow,
        size: 0.055,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const scratch = useRef(new THREE.Vector3());

  useFrame((state) => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = attr.array as Float32Array;
    // When motion is reduced, particles are pinned at their seed offsets so the
    // links still read as populated without anything moving.
    const t = reduced ? 0 : state.clock.elapsedTime;

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const u = (s.offset + t * s.speed) % 1;
      LINK_CURVES[s.link].getPoint(u, scratch.current);
      array[i * 3] = scratch.current.x;
      array[i * 3 + 1] = scratch.current.y;
      array[i * 3 + 2] = scratch.current.z;
    }
    attr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/**
 * Deterministic PRNG (mulberry32).
 *
 * `Math.random()` is impure and must not run during render — and a fixed seed is
 * better here anyway: the dust field is identical on every load, so the scene
 * composition is something that can actually be art-directed rather than
 * re-rolled each refresh.
 */
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function AmbientDust({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const random = seededRandom(0x5eed1a);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Spread across a wide, shallow volume; bias depth away from the camera
      // so dust reads behind the network rather than in front of the panels.
      positions[i * 3] = (random() - 0.5) * 26;
      positions[i * 3 + 1] = (random() - 0.5) * 16;
      positions[i * 3 + 2] = -random() * 22 + 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: SCENE_COLORS.silver,
        size: 0.03,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <points geometry={geometry} material={material} />;
}

export function DataParticles({ mobile = false, reduced = false }: { mobile?: boolean; reduced?: boolean }) {
  return (
    <>
      <FlowParticles perLink={mobile ? PER_LINK_MOBILE : PER_LINK_DESKTOP} reduced={reduced} />
      <AmbientDust count={mobile ? 70 : 190} />
    </>
  );
}
