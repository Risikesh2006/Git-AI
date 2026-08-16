'use client';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { REPOSITORIES, SCENE_COLORS } from '@/lib/constants';

/**
 * Curved data links between each repository node and the intelligence core.
 *
 * The control point is pushed off the straight line and away from the origin, so
 * links bow outward instead of forming a flat star — that curvature is what
 * makes the network read as a spatial graph rather than a diagram.
 *
 * Each link's opacity drifts on its own slow cycle to imply the scanner sampling
 * one repository at a time.
 */

/** Builds the bowed curve for a node → core link. Shared with DataParticles. */
export function buildLinkCurve(from: THREE.Vector3, to: THREE.Vector3): THREE.QuadraticBezierCurve3 {
  const mid = from.clone().lerp(to, 0.5);
  // Push the midpoint away from the world origin to create the bow.
  const outward = mid.clone().normalize().multiplyScalar(0.85);
  mid.add(outward);
  mid.y += 0.35;
  return new THREE.QuadraticBezierCurve3(from, mid, to);
}

export const LINK_CURVES: THREE.QuadraticBezierCurve3[] = REPOSITORIES.map((repo) =>
  buildLinkCurve(new THREE.Vector3(...repo.position), new THREE.Vector3(0, 0, 0))
);

/*
  Line objects are created once at module scope.

  This is deliberate. These objects are both read during render (passed to
  <primitive>) and mutated every frame (material opacity), which is a
  combination React's rules disallow for state, refs and memoized values alike —
  correctly, because none of those model a long-lived mutable GPU resource.

  Module scope does model it: the geometry is static, the link topology never
  changes, and the scene is a fixed page background that mounts once. The
  tradeoff is that the buffers are not released until the page unloads, which for
  five short polylines is a few kilobytes of VRAM — a deliberate trade against
  the alternative of re-uploading them on every remount.
*/
const LINK_LINES: THREE.Line[] = LINK_CURVES.map((curve) => {
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
  const material = new THREE.LineBasicMaterial({
    color: SCENE_COLORS.line,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  return new THREE.Line(geometry, material);
});

export function ConnectionLines({ reduced = false }: { reduced?: boolean }) {
  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < LINK_LINES.length; i++) {
      const material = LINK_LINES[i].material as THREE.LineBasicMaterial;
      // Staggered breathing: each link peaks at a different moment.
      material.opacity = 0.13 + (Math.sin(t * 0.5 + i * 1.35) * 0.5 + 0.5) * 0.16;
    }
  });

  return (
    <group>
      {LINK_LINES.map((line, i) => (
        <primitive key={REPOSITORIES[i].id} object={line} />
      ))}
    </group>
  );
}
