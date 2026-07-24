"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function ParticleField() {
  const points = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const { positions, sizes, colors } = useMemo(() => {
    const count = 400;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const gold = new THREE.Color("#d4a84b");
    const teal = new THREE.Color("#4fd1c5");
    const warm = new THREE.Color("#f5d06a");

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5;
      positions[i3 + 2] = radius * Math.cos(phi) - 5;

      sizes[i] = Math.random() * 0.08 + 0.02;

      const c = Math.random();
      const color = c < 0.5 ? gold : c < 0.8 ? teal : warm;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, sizes, colors };
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    const t = state.clock.elapsedTime;

    points.current.rotation.y = t * 0.03 + mouse.x * 0.15;
    points.current.rotation.x = t * 0.01 + mouse.y * 0.1;

    const geom = points.current.geometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += Math.sin(t * 0.5 + i) * 0.002;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroParticles({ className }: { className?: string }) {
  const dpr = useMemo(() => (typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1), []);

  return (
    <div className={className} style={{ pointerEvents: "none" }}>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}
