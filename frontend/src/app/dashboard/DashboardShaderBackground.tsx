'use client';

import { useEffect, useRef } from 'react';

const VERTEX = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    vec2 mouse = (u_mouse / u_resolution - 0.5) * 2.0;
    mouse.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.15;
    vec2 flow = vec2(
      fbm(p * 1.2 + vec2(t * 0.4, t * 0.25)),
      fbm(p * 1.2 + vec2(-t * 0.3, t * 0.35) + 4.0)
    );
    p += flow * 0.35;

    float depth = fbm(p * 0.8 + vec2(t * 0.1, -t * 0.08));
    float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.8;

    vec2 orb1 = p - vec2(-0.6 + sin(t * 0.5) * 0.15, 0.35 + cos(t * 0.4) * 0.1) + mouse * 0.12;
    vec2 orb2 = p - vec2(0.75 + cos(t * 0.35) * 0.12, -0.45 + sin(t * 0.45) * 0.08) - mouse * 0.08;
    float glow1 = exp(-dot(orb1, orb1) * 2.5) * 0.12;
    float glow2 = exp(-dot(orb2, orb2) * 3.0) * 0.08;

    float grain = hash(uv * u_resolution + u_time) * 0.04;
    float silver = depth * 0.06 + glow1 + glow2;
    float base = 0.024 + silver * vignette;

    vec3 color = vec3(base + grain);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function DashboardShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX * Math.min(window.devicePixelRatio, 2), y: e.clientY * Math.min(window.devicePixelRatio, 2) };
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);

    const start = performance.now();
    const render = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouseRef.current.x, canvas.height - mouseRef.current.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div className="dashboard-shader-wrap" aria-hidden>
      <canvas ref={canvasRef} className="dashboard-shader-canvas" />
      <div className="dashboard-shader-vignette" />
      <div className="dashboard-shader-grid" />
    </div>
  );
}
