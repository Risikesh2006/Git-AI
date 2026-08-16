'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_PATH } from '@/lib/constants';
import { scrollState, clamp } from '@/lib/animations';

/**
 * Scroll-driven cinematic camera.
 *
 * Position follows a CatmullRomCurve3 sampled with `getPointAt`, which
 * re-parameterises by arc length — so the camera covers equal distance per
 * unit of scroll instead of racing through the straight segments and crawling
 * round the curves. That constant velocity is what makes the move feel like a
 * dolly rather than a scrub.
 *
 * The lookAt target is interpolated separately from position. This is what
 * lets the camera keep a repository node framed while translating past it,
 * and it means the aim never snaps between beats.
 *
 * Both channels are exponentially damped (frame-rate independent), so a fast
 * flick of the wheel still resolves into a slow glide — the single most
 * important guard against motion sickness here.
 */
export function CameraRig({ reduced = false }: { reduced?: boolean }) {
  const { camera, size } = useThree();

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CAMERA_PATH.map((w) => new THREE.Vector3(...w.position)),
        false,
        'catmullrom',
        0.4
      ),
    []
  );

  const lookTargets = useMemo(() => CAMERA_PATH.map((w) => new THREE.Vector3(...w.lookAt)), []);

  // Scratch vectors — reused every frame so the loop allocates nothing.
  const tmpPos = useRef(new THREE.Vector3());
  const tmpLook = useRef(new THREE.Vector3());
  const currentLook = useRef(new THREE.Vector3(...CAMERA_PATH[0].lookAt));
  const smoothedProgress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  // On narrow viewports pull the camera back so the network still fits.
  const distanceScale = size.width < 768 ? 1.28 : size.width < 1180 ? 1.1 : 1;

  useFrame((state, delta) => {
    // delta can spike after a tab regains focus; clamp so damping stays sane.
    const dt = Math.min(delta, 0.05);

    if (reduced) {
      // Static, safe framing. Content and layout are unaffected.
      const p = curve.getPointAt(0);
      camera.position.set(p.x * distanceScale, p.y, p.z * distanceScale);
      camera.lookAt(lookTargets[0]);
      return;
    }

    const target = clamp(scrollState.progress);
    // First damp: smooths the scroll signal itself.
    smoothedProgress.current = THREE.MathUtils.damp(smoothedProgress.current, target, 3.4, dt);
    const p = clamp(smoothedProgress.current);

    curve.getPointAt(p, tmpPos.current);
    tmpPos.current.x *= distanceScale;
    tmpPos.current.z *= distanceScale;

    // Subtle cursor parallax, scaled down as the camera closes in so it never
    // fights the choreography during the tight beats.
    const parallax = 0.5 * (1 - Math.abs(p - 0.5) * 0.6);
    tmpPos.current.x += pointer.current.x * parallax;
    tmpPos.current.y += pointer.current.y * parallax * 0.6;

    // Second damp: smooths the resulting position.
    camera.position.lerp(tmpPos.current, 1 - Math.exp(-5.5 * dt));

    // Aim: walk the waypoint list and blend between the two bracketing targets.
    const seg = p * (lookTargets.length - 1);
    const i = Math.min(Math.floor(seg), lookTargets.length - 2);
    tmpLook.current.lerpVectors(lookTargets[i], lookTargets[i + 1], seg - i);
    currentLook.current.lerp(tmpLook.current, 1 - Math.exp(-4.2 * dt));
    camera.lookAt(currentLook.current);

    // Track pointer for the next frame's parallax.
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
  });

  return null;
}
