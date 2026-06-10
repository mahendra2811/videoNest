"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";

/**
 * "Blur → Sharp" hero background: a fullscreen sunset mosaic whose pixel grid
 * animates from coarse (blurry/low-res) to fine (sharp) and back — a literal nod
 * to what VideoNest does. One fullscreen shader plane, so it's GPU-cheap.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Fullscreen quad in NDC — camera-independent.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec3 cFrom;
  uniform vec3 cVia;
  uniform vec3 cTo;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  vec3 gradient(float t) {
    t = clamp(t, 0.0, 1.0);
    return mix(mix(cFrom, cVia, smoothstep(0.0, 0.5, t)), cTo, smoothstep(0.5, 1.0, t));
  }

  void main() {
    vec2 uv = vUv;

    // Sharpness breathes 0..1 (0 = coarse/blurry, 1 = fine/sharp).
    float sharp = 0.5 + 0.5 * sin(uTime * 0.45);

    // Grid density grows with sharpness; aspect-corrected.
    float cells = mix(9.0, 150.0, sharp * sharp);
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 grid = vec2(cells * aspect, cells);

    // Quantize to cell centers -> mosaic that gets finer as it "sharpens".
    vec2 cell = (floor(uv * grid) + 0.5) / grid;

    // Slowly drifting diagonal gradient.
    float t = (cell.x + (1.0 - cell.y)) * 0.5 + 0.08 * sin(uTime * 0.2);
    vec3 col = gradient(t);

    // Per-cell flicker — stronger while coarse, to read as low-res noise.
    float n = hash(cell + floor(uTime * 0.7));
    col += (n - 0.5) * 0.10 * (1.0 - sharp);

    // Soft radial fade so edges melt into the page background.
    float v = smoothstep(1.15, 0.25, distance(uv, vec2(0.5)));

    gl_FragColor = vec4(col, 0.42 * v);
  }
`;

function ShaderPlane() {
  const ref = React.useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);

  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      cFrom: { value: new THREE.Color("#FF8C42") },
      cVia: { value: new THREE.Color("#FF5E78") },
      cTo: { value: new THREE.Color("#FF2E93") },
    }),
    [],
  );

  React.useEffect(() => {
    uniforms.uRes.value.set(size.width, size.height);
  }, [size, uniforms]);

  useFrame((state) => {
    if (ref.current) ref.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function HeroShader() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      style={{ width: "100%", height: "100%" }}
      aria-hidden
    >
      <ShaderPlane />
    </Canvas>
  );
}
