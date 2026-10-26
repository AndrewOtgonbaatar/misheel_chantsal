"use client";

import { useLayoutEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { PANEL } from "@/components/scene/layout";
import { frameLock, useStore } from "@/components/store";

const WALL = [
  "/textures/plaster-color.jpg?v=2",
  "/textures/plaster-normal.jpg?v=2",
  "/textures/plaster-rough.jpg?v=2",
  "/textures/plaster-height.jpg?v=2",
];

const FRAME = ["/textures/frame-color.jpg", "/textures/frame-normal.jpg"];

function prepareMaps(maps: THREE.Texture[], colorIndex: number) {
  maps.forEach((map, index) => {
    map.colorSpace =
      index === colorIndex ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
  });
}

export default function Wall() {
  const { section, spotlight, setHolding } = useStore();
  const maps = useLoader(THREE.TextureLoader, WALL);
  const frameMaps = useLoader(THREE.TextureLoader, FRAME);

  useLayoutEffect(() => {
    prepareMaps(maps, 0);
    prepareMaps(frameMaps, 0);
    frameMaps.forEach((map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(2.4, 1.4);
    });
  }, [maps, frameMaps]);

  const [color, normal, rough, height] = maps;
  const [frameColor, frameNormal] = frameMaps;

  const bars = useMemo(() => {
    const t = 0.42;
    const d = 0.18;
    const { x, y, w, h } = PANEL;
    return [
      { position: [x - w / 2 - t / 2, y, d / 2] as const, size: [t, h + t * 2, d] as const },
      { position: [x + w / 2 + t / 2, y, d / 2] as const, size: [t, h + t * 2, d] as const },
      { position: [x, y + h / 2 + t / 2, d / 2] as const, size: [w, t, d] as const },
      { position: [x, y - h / 2 - t / 2, d / 2] as const, size: [w, t, d] as const },
    ];
  }, [PANEL.x, PANEL.y, PANEL.w, PANEL.h]);

  return (
    <group>
      <mesh position={[PANEL.x, PANEL.y, 0]} receiveShadow castShadow>
        <planeGeometry args={[PANEL.w, PANEL.h, 140, 80]} />
        <meshStandardMaterial
          map={color}
          normalMap={normal}
          normalScale={new THREE.Vector2(1.25, 1.25)}
          roughnessMap={rough}
          roughness={0.96}
          metalness={0}
          displacementMap={height}
          displacementScale={0.05}
        />
      </mesh>

      {bars.map((bar) => (
        <mesh key={bar.position.join("-")} position={bar.position} castShadow receiveShadow>
          <boxGeometry args={bar.size} />
          <meshStandardMaterial
            map={frameColor}
            normalMap={frameNormal}
            normalScale={new THREE.Vector2(0.7, 0.7)}
            roughness={0.94}
            metalness={0}
            color="#fff4f6"
          />
        </mesh>
      ))}

      <mesh
        position={[PANEL.x, PANEL.y, 0.02]}
        onPointerDown={(event) => {
          if (section || spotlight) return;
          event.stopPropagation();
          const startX = event.nativeEvent.clientX;
          const startY = event.nativeEvent.clientY;
          const timer = window.setTimeout(() => {
            frameLock.on = true;
            setHolding(true);
          }, 320);
          const move = (native: PointerEvent) => {
            if (Math.hypot(native.clientX - startX, native.clientY - startY) > 8) {
              window.clearTimeout(timer);
            }
          };
          const release = () => {
            window.clearTimeout(timer);
            frameLock.on = false;
            setHolding(false);
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", release);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", release);
        }}
      >
        <planeGeometry args={[PANEL.w - 0.08, PANEL.h - 0.08]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
