import * as THREE from 'three';
import { SCENE_COLORS } from '@/lib/constants';

/**
 * Runtime-generated canvas textures for the in-scene interface panels.
 *
 * Why canvas rather than drei's <Text>: troika-three-text fetches a font file
 * from a CDN at runtime, which adds a network dependency the scene would
 * silently render wrong (or blank) without. Painting to a 2D canvas keeps the
 * whole scene self-contained and offline-safe, and gives us real UI chrome —
 * rules, bars, labels — not just glyphs.
 *
 * All textures are created once via useMemo by their consumer and disposed on
 * unmount.
 */

const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** Allocates a DPR-aware canvas and returns its 2D context in CSS pixels. */
function createCanvas(width: number, height: number, scale = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.scale(scale, scale);
  return { canvas, ctx };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function finalise(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * The central Git AI intelligence panel: the recommended task, the repository
 * it belongs to and its priority score — the product's core output.
 */
export function createCorePanelTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 320;
  const { canvas, ctx } = createCanvas(W, H);

  // Panel body — translucent charcoal glass.
  ctx.fillStyle = 'rgba(16, 20, 17, 0.92)';
  roundRect(ctx, 1, 1, W - 2, H - 2, 18);
  ctx.fill();

  // Inner top highlight, mimicking a lit glass edge.
  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0.015)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  roundRect(ctx, 1, 1, W - 2, H - 2, 18);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  roundRect(ctx, 1, 1, W - 2, H - 2, 18);
  ctx.stroke();

  // Header
  ctx.fillStyle = SCENE_COLORS.sage;
  ctx.font = `500 12px ${MONO}`;
  ctx.letterSpacing = '2px';
  ctx.fillText('REPOSITORY INTELLIGENCE', 26, 40);

  // Live indicator
  ctx.beginPath();
  ctx.arc(W - 34, 36, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = SCENE_COLORS.glow;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.moveTo(26, 58);
  ctx.lineTo(W - 26, 58);
  ctx.stroke();

  // Repository + status
  ctx.fillStyle = '#f5f6f2';
  ctx.font = `600 30px ${SANS}`;
  ctx.letterSpacing = '-0.5px';
  ctx.fillText('Memory OS', 26, 96);

  ctx.fillStyle = '#9ca39b';
  ctx.font = `400 13px ${SANS}`;
  ctx.letterSpacing = '0px';
  ctx.fillText('Status: Needs Attention', 26, 118);

  // Priority score, right aligned
  ctx.textAlign = 'right';
  ctx.fillStyle = SCENE_COLORS.sage;
  ctx.font = `600 46px ${MONO}`;
  ctx.fillText('94', W - 26, 104);
  ctx.fillStyle = '#9ca39b';
  ctx.font = `500 10px ${MONO}`;
  ctx.letterSpacing = '1.5px';
  ctx.fillText('PRIORITY', W - 26, 122);
  ctx.textAlign = 'left';

  // Score bar
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  roundRect(ctx, 26, 138, W - 52, 4, 2);
  ctx.fill();
  ctx.fillStyle = SCENE_COLORS.sage;
  roundRect(ctx, 26, 138, (W - 52) * 0.94, 4, 2);
  ctx.fill();

  // Recommended task block
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  roundRect(ctx, 26, 164, W - 52, 92, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, 26, 164, W - 52, 92, 12);
  ctx.stroke();

  ctx.fillStyle = '#9ca39b';
  ctx.font = `500 10px ${MONO}`;
  ctx.letterSpacing = '1.5px';
  ctx.fillText('RECOMMENDED TASK', 42, 188);

  ctx.fillStyle = '#f5f6f2';
  ctx.font = `500 17px ${SANS}`;
  ctx.letterSpacing = '0px';
  ctx.fillText('Implement semantic memory', 42, 214);
  ctx.fillText('search API', 42, 236);

  // Footer: estimate + approval note
  ctx.fillStyle = SCENE_COLORS.sage;
  ctx.font = `500 11px ${MONO}`;
  ctx.letterSpacing = '1px';
  ctx.fillText('EST 2H 30M', 26, 286);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9ca39b';
  ctx.fillText('REVIEW BEFORE PUSH', W - 26, 286);
  ctx.textAlign = 'left';

  return finalise(canvas);
}

/**
 * Compact label panel for an orbiting repository node: name, score and a
 * proportional score bar.
 */
export function createNodeTexture(name: string, score: number, active = false): THREE.CanvasTexture {
  const W = 320;
  const H = 96;
  const { canvas, ctx } = createCanvas(W, H);

  ctx.fillStyle = active ? 'rgba(22, 28, 22, 0.95)' : 'rgba(16, 20, 17, 0.88)';
  roundRect(ctx, 1, 1, W - 2, H - 2, 14);
  ctx.fill();

  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, 'rgba(255,255,255,0.09)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  roundRect(ctx, 1, 1, W - 2, H - 2, 14);
  ctx.fill();

  ctx.strokeStyle = active ? 'rgba(184,199,156,0.45)' : 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  roundRect(ctx, 1, 1, W - 2, H - 2, 14);
  ctx.stroke();

  // Name
  ctx.fillStyle = '#f5f6f2';
  ctx.font = `500 19px ${SANS}`;
  ctx.letterSpacing = '-0.3px';
  ctx.fillText(name, 20, 38);

  // Score
  ctx.textAlign = 'right';
  ctx.fillStyle = active ? SCENE_COLORS.sage : '#9ca39b';
  ctx.font = `600 22px ${MONO}`;
  ctx.fillText(String(score), W - 20, 38);
  ctx.textAlign = 'left';

  // Score bar
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  roundRect(ctx, 20, 56, W - 40, 3, 1.5);
  ctx.fill();
  ctx.fillStyle = active ? SCENE_COLORS.glow : 'rgba(215,219,212,0.55)';
  roundRect(ctx, 20, 56, (W - 40) * (score / 100), 3, 1.5);
  ctx.fill();

  ctx.fillStyle = '#6f776d';
  ctx.font = `500 9px ${MONO}`;
  ctx.letterSpacing = '1.4px';
  ctx.fillText('PRIORITY SCORE', 20, 78);

  return finalise(canvas);
}

/** Faint code-fragment plate used as ambient depth detail. */
export function createCodeFragmentTexture(lines: string[]): THREE.CanvasTexture {
  const W = 256;
  const H = 128;
  const { canvas, ctx } = createCanvas(W, H);

  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.font = `400 11px ${MONO}`;
  lines.forEach((line, i) => {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(184,199,156,0.42)' : 'rgba(255,255,255,0.26)';
    ctx.fillText(line, 8, 20 + i * 17);
  });

  return finalise(canvas);
}
