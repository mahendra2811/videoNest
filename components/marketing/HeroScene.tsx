"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as React from "react";
import type * as THREE from "three";

/**
 * A tiny, decorative rotating "nest" — a wireframe icosahedron in the brand
 * sunset palette. Intentionally minimal (one mesh) so the lazily-loaded three.js
 * chunk stays cheap. Loaded only by HeroVisual, and only on capable connections.
 */
function NestMesh() {
  const outer = React.useRef<THREE.Mesh>(null);
  const inner = React.useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (outer.current) {
      outer.current.rotation.y += delta * 0.25;
      outer.current.rotation.x += delta * 0.08;
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * 0.4;
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color="#FF8C42" />
      <pointLight position={[-4, -2, 2]} intensity={1} color="#FF2E93" />
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshBasicMaterial color="#FF5E78" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#FF8C42" roughness={0.3} metalness={0.1} wireframe />
      </mesh>
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
      aria-hidden
    >
      <NestMesh />
    </Canvas>
  );
}
