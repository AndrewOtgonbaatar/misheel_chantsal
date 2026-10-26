"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA } from "@/components/scene/layout";
import { useStore } from "@/components/store";
import Wall from "@/components/scene/wall";
import Polaroids from "@/components/scene/polaroid";

function frameFor(width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  if (width < 520 || aspect < 0.7) return { fov: 42, z: 11.2 };
  if (width < 860 || aspect < 1) return { fov: 36, z: 10.5 };
  if (width < 1400) return { fov: 33, z: 10.4 };
  if (aspect > 2.1) return { fov: 24, z: 9.55 };
  return { fov: CAMERA.fov, z: CAMERA.z };
}

function Rig() {
  const { camera, pointer, size, gl } = useThree();
  const { spotlight, holding } = useStore();
  const shift = useRef({ x: 0, y: 0 });
  const look = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!holding) return;
    const canvas = gl.domElement;
    look.current.x = shift.current.x;
    look.current.y = shift.current.y;
    const onMove = (event: MouseEvent) => {
      look.current.x += event.movementX * 0.0046;
      look.current.y -= event.movementY * 0.0026;
    };
    window.addEventListener("mousemove", onMove);
    void Promise.resolve(canvas.requestPointerLock()).catch(() => {});
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [holding, gl]);

  useFrame((_, delta) => {
    const view = camera as THREE.PerspectiveCamera;
    const frame = frameFor(size.width, size.height);
    if (Math.abs(view.fov - frame.fov) > 0.1) {
      view.fov = frame.fov;
      view.updateProjectionMatrix();
    }

    const locked = document.pointerLockElement === gl.domElement;
    if (holding && !spotlight && !locked) {
      if (Math.abs(pointer.x) > 0.98) look.current.x += Math.sign(pointer.x) * delta * 1.7;
      if (Math.abs(pointer.y) > 0.98) look.current.y += Math.sign(pointer.y) * delta * 1.05;
    }

    const aimX = spotlight ? 0 : holding ? look.current.x : pointer.x * 1.05;
    const aimY = spotlight ? 0 : holding ? look.current.y : pointer.y * 0.56;
    shift.current.x = THREE.MathUtils.damp(shift.current.x, aimX, 2.4, delta);
    shift.current.y = THREE.MathUtils.damp(shift.current.y, aimY, 2.4, delta);
    view.position.x = CAMERA.x + shift.current.x;
    view.position.y = CAMERA.y + shift.current.y;
    view.position.z = frame.z;
    view.lookAt(CAMERA.lookX + shift.current.x, CAMERA.lookY + shift.current.y, 0);
  }, -1);

  return null;
}

function Scene({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <>
      <color attach="background" args={["#f3d0d8"]} />
      <hemisphereLight args={["#fff7f8", "#efc2cb", 0.95]} />
      <ambientLight intensity={0.28} color="#ffe9ee" />
      <directionalLight
        position={[-5.5, 7.5, 6.5]}
        intensity={1.7}
        color="#fff8f7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={26}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[3.5, 1.5, 5]} intensity={0.38} color="#fff1f4" />
      <Rig />
      <Wall />
      <Polaroids />
    </>
  );
}

export default function Stage({ onReady }: { onReady: () => void }) {
  return (
    <div className="stage">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{
          position: [CAMERA.x, CAMERA.y, CAMERA.z],
          fov: CAMERA.fov,
          near: 0.1,
          far: 40,
        }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Suspense fallback={null}>
          <Scene onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
