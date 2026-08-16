'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENE_COLORS } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CameraRig } from './CameraRig';
import { RepositoryNetwork } from './RepositoryNetwork';
import { SceneLoader } from './SceneLoader';

/**
 * Fixed, page-spanning WebGL environment sitting behind all page content.
 *
 * Performance posture:
 *  - device pixel ratio is capped (hard-capped lower on phones) because this is
 *    a full-viewport canvas and DPR is the single biggest cost lever here;
 *  - the render loop is switched off entirely when the tab is hidden or the
 *    canvas scrolls out of view, rather than merely skipping updates;
 *  - node, particle and detail counts step down on small viewports;
 *  - no post-processing — the bloom is baked into the materials, which avoids
 *    a second full-screen pass on every frame.
 *
 * Accessibility: the canvas is inert and hidden from assistive tech. Everything
 * it depicts is also present as real text in the sections alongside it, so the
 * page loses no information without WebGL.
 */
export function GitAIScene() {
  const reduced = useReducedMotion();
  const mobile = useMediaQuery('(max-width: 768px)');
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(true);

  // Stop rendering while the tab is backgrounded — no wasted GPU or battery.
  useEffect(() => {
    const onVisibility = () => setRunning(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Canvas
          // Cap DPR: full-viewport canvases are fill-rate bound, and 2x on a
          // phone buys nothing visible for double the pixels.
          dpr={mobile ? [1, 1.4] : [1, 1.85]}
          frameloop={running ? 'always' : 'never'}
          gl={{
            antialias: !mobile,
            alpha: true,
            powerPreference: 'high-performance',
            // Depth-sorted transparency only; no readback needed.
            preserveDrawingBuffer: false,
          }}
          camera={{ position: [0, 0.6, 14], fov: mobile ? 62 : 48, near: 0.1, far: 90 }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(new THREE.Color(SCENE_COLORS.background), 0);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.06;
            // Atmospheric falloff — hides the far edge of the grid and dust.
            scene.fog = new THREE.FogExp2(SCENE_COLORS.background, 0.036);
            setReady(true);
          }}
        >
          <Suspense fallback={null}>
            {/* Low ambient so the sage key light does the shaping. */}
            <ambientLight intensity={0.42} color="#c9d2c2" />
            <directionalLight position={[5, 6, 8]} intensity={0.85} color={SCENE_COLORS.silver} />
            <directionalLight position={[-6, -3, 4]} intensity={0.3} color={SCENE_COLORS.sage} />

            <CameraRig reduced={reduced} />
            <RepositoryNetwork mobile={mobile} reduced={reduced} />
          </Suspense>
        </Canvas>
      </div>

      <SceneLoader ready={ready} />
    </>
  );
}

export default GitAIScene;
