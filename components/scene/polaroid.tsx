"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { shots, type Shot } from "@/data/portfolio";
import { CAMERA, PANEL, PHOTO } from "@/components/scene/layout";
import { frameLock, useStore } from "@/components/store";

const PAPER = "#f4efe4";
const PICTURE_ABOVE_CENTER = ((450 - (48 + 660) / 2) / 900) * PHOTO.h;
const BOUNDS = {
  minX: PANEL.x - PANEL.w / 2 + 0.85,
  maxX: PANEL.x + PANEL.w / 2 - 0.85,
  minY: PANEL.y - PANEL.h / 2 + 0.95,
  maxY: PANEL.y + PANEL.h / 2 - 0.95,
};

function drawPolaroid(image: HTMLImageElement | null, label: string) {
  const width = 740;
  const height = 900;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const pen = canvas.getContext("2d");
  if (!pen) return null;

  pen.fillStyle = PAPER;
  pen.fillRect(0, 0, width, height);

  const grain = pen.getImageData(0, 0, width, height);
  for (let i = 0; i < grain.data.length; i += 4) {
    const wobble = (Math.random() - 0.5) * 14;
    grain.data[i] += wobble;
    grain.data[i + 1] += wobble;
    grain.data[i + 2] += wobble * 0.7;
  }
  pen.putImageData(grain, 0, 0);

  const pad = 52;
  const photoTop = 48;
  const photoWidth = width - pad * 2;
  const photoHeight = 660;

  if (image) {
    const scale = Math.max(photoWidth / image.width, photoHeight / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    pen.save();
    pen.beginPath();
    pen.rect(pad, photoTop, photoWidth, photoHeight);
    pen.clip();
    pen.drawImage(
      image,
      pad + (photoWidth - drawWidth) / 2,
      photoTop + (photoHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
    pen.restore();
  } else {
    pen.fillStyle = "#e7d5c8";
    pen.fillRect(pad, photoTop, photoWidth, photoHeight);
  }

  pen.fillStyle = "#2b2622";
  pen.textAlign = "center";
  pen.textBaseline = "middle";
  let fontSize = 68;
  pen.font = `500 ${fontSize}px Georgia, "Times New Roman", serif`;
  while (pen.measureText(label).width > width - 80 && fontSize > 40) {
    fontSize -= 2;
    pen.font = `500 ${fontSize}px Georgia, "Times New Roman", serif`;
  }
  pen.fillText(label, width / 2, 804);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

function Polaroid({
  shot,
  shadow,
  order,
}: {
  shot: Shot;
  shadow: THREE.Texture;
  order: number;
}) {
  const { section, selectedId, spotlight, zoom, aimedId, holding, setSection, openSpotlight, setHolding } =
    useStore();
  const { camera, gl, size } = useThree();
  const group = useRef<THREE.Group>(null);
  const face = useRef<THREE.MeshStandardMaterial>(null);
  const start = shot.home ?? shot.focus ?? { x: 0, y: -6, rot: 0 };
  const placed = useRef(shot.home ? { ...shot.home } : null);
  const pos = useRef({ x: start.x, y: start.y });
  const rot = useRef((start.rot * Math.PI) / 180);
  const tilt = useRef(0);
  const free = useRef(false);
  const drag = useRef(false);
  const hover = useRef(false);
  const clickTimer = useRef<number | null>(null);
  const seen = useRef({ section, spotlight });
  const led = useRef(false);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.12), []);

  useEffect(() => {
    let alive = true;
    const material = face.current;
    loadImage(shot.src)
      .then((image) => {
        if (!alive || !material) return;
        const texture = drawPolaroid(image, shot.label);
        if (!texture) return;
        material.map = texture;
        material.needsUpdate = true;
      })
      .catch(() => {
        if (!alive || !material) return;
        const texture = drawPolaroid(null, shot.label);
        if (!texture) return;
        material.map = texture;
        material.needsUpdate = true;
      });
    return () => {
      alive = false;
      material?.map?.dispose();
    };
  }, [shot.label, shot.src]);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;

    if (seen.current.section !== section || seen.current.spotlight !== spotlight) {
      seen.current = { section, spotlight };
      free.current = false;
    }

    const featured = selectedId === shot.id;
    const aimed = holding && !section && aimedId === shot.id;
    if (spotlight && featured && !led.current) free.current = false;
    led.current = Boolean(spotlight && featured);
    const narrow = size.width < 860;
    const spotScale = size.width < 520 ? 1.22 : narrow ? 1.45 : size.height < 760 ? 1.7 : 1.95;
    const slot =
      section && shot.section === section ? shot.focus : section ? undefined : placed.current;
    const place =
      spotlight && featured
        ? {
            x: CAMERA.lookX,
            y:
              CAMERA.lookY -
              PICTURE_ABOVE_CENTER * spotScale * zoom +
              THREE.MathUtils.clamp((1.35 - zoom) / 0.35, 0, 1) * 0.46,
            rot: 0,
          }
        : spotlight
          ? undefined
          : slot;
    const visible = Boolean(place);

    if (!drag.current && !free.current && place) {
      pos.current.x = THREE.MathUtils.damp(pos.current.x, place.x, 4.5, delta);
      pos.current.y = THREE.MathUtils.damp(pos.current.y, place.y, 4.5, delta);
      rot.current = THREE.MathUtils.damp(rot.current, (place.rot * Math.PI) / 180, 4.5, delta);
    }

    tilt.current = THREE.MathUtils.damp(tilt.current, 0, 5, delta);
    const onWall = (aimed ? 0.46 : drag.current || hover.current ? 0.24 : 0.1) + order * 0.008;
    const inFront =
      0.62 +
      (featured ? 0.5 : order * 0.03) +
      (drag.current || hover.current ? 0.12 : 0);
    node.position.x = pos.current.x;
    node.position.y = pos.current.y;
    node.position.z = THREE.MathUtils.damp(
      node.position.z,
      visible ? (spotlight && featured ? 0.95 : section ? inFront : onWall) : 0.02,
      8,
      delta,
    );
    node.renderOrder = aimed ? 40 : featured ? 80 : section && visible ? 20 + order : order;
    node.rotation.z = rot.current + tilt.current;
    const groupScale = size.width < 520 ? 0.82 : narrow ? 0.95 : size.width < 1400 ? 1.05 : 1.16;
    const targetScale = !visible
      ? 0.001
      : spotlight && featured
        ? spotScale * zoom
        : section
          ? groupScale
          : aimed
            ? 1.48
            : 1;
    const scale = THREE.MathUtils.damp(node.scale.x, targetScale, 6, delta);
    node.scale.setScalar(Math.max(scale, 0.001));
    node.visible = scale > 0.02;
  });

  function pointOnWall(event: PointerEvent) {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.ray.intersectPlane(plane, hit);
  }

  function grab(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const origin = pointOnWall(event.nativeEvent);
    if (!origin) return;
    drag.current = true;
    hover.current = true;
    gl.domElement.style.cursor = "grabbing";
    let framing = false;
    let moved = false;
    let holdTimer = 0;
    if (!section && !spotlight) {
      holdTimer = window.setTimeout(() => {
        if (moved) return;
        framing = true;
        drag.current = false;
        frameLock.on = true;
        setHolding(true);
      }, 320);
    }

    const startX = origin.x;
    const startY = origin.y;
    const baseX = pos.current.x;
    const baseY = pos.current.y;
    let lastX = origin.x;

    const move = (native: PointerEvent) => {
      if (framing) return;
      const next = pointOnWall(native);
      if (!next) return;
      const x = THREE.MathUtils.clamp(baseX + next.x - startX, BOUNDS.minX, BOUNDS.maxX);
      const y = THREE.MathUtils.clamp(baseY + next.y - startY, BOUNDS.minY, BOUNDS.maxY);
      if (Math.hypot(x - baseX, y - baseY) <= 0.07) return;
      moved = true;
      window.clearTimeout(holdTimer);
      tilt.current = THREE.MathUtils.clamp((next.x - lastX) * 1.4, -0.18, 0.18);
      lastX = next.x;
      pos.current.x = x;
      pos.current.y = y;
    };

    const release = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.clearTimeout(holdTimer);
      drag.current = false;
      gl.domElement.style.cursor = hover.current ? "grab" : "";
      if (framing) {
        frameLock.on = false;
        setHolding(false);
        return;
      }
      if (moved) {
        free.current = true;
        if (!section && placed.current) {
          placed.current = {
            x: pos.current.x,
            y: pos.current.y,
            rot: (rot.current * 180) / Math.PI,
          };
        }
      } else {
        if (clickTimer.current) window.clearTimeout(clickTimer.current);
        clickTimer.current = window.setTimeout(() => {
          setSection(shot.section, shot.id);
        }, 220);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
  }

  return (
    <group ref={group} position={[start.x, start.y, 0.09]} userData={{ shotId: shot.id }}>
      <mesh position={[0.04, -0.05, -0.025]} renderOrder={1}>
        <planeGeometry args={[PHOTO.w + 0.42, PHOTO.h + 0.42]} />
        <meshBasicMaterial
          alphaMap={shadow}
          color="#b86d7c"
          transparent
          depthWrite={false}
          opacity={0.62}
        />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        onPointerDown={grab}
        onDoubleClick={(event) => {
          event.stopPropagation();
          if (clickTimer.current) window.clearTimeout(clickTimer.current);
          free.current = false;
          openSpotlight(shot.id, shot.section);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          hover.current = true;
          gl.domElement.style.cursor = "grab";
        }}
        onPointerOut={() => {
          if (drag.current) return;
          hover.current = false;
          gl.domElement.style.cursor = "";
        }}
      >
        <boxGeometry args={[PHOTO.w, PHOTO.h, PHOTO.d]} />
        <meshStandardMaterial attach="material-0" color={PAPER} roughness={0.86} />
        <meshStandardMaterial attach="material-1" color={PAPER} roughness={0.86} />
        <meshStandardMaterial attach="material-2" color={PAPER} roughness={0.86} />
        <meshStandardMaterial attach="material-3" color={PAPER} roughness={0.86} />
        <meshStandardMaterial
          ref={face}
          attach="material-4"
          color="#ffffff"
          roughness={0.78}
        />
        <meshStandardMaterial attach="material-5" color="#efe6d4" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function Polaroids() {
  const shadow = useLoader(THREE.TextureLoader, "/textures/shadow.png");

  useEffect(() => {
    shadow.colorSpace = THREE.LinearSRGBColorSpace;
  }, [shadow]);

  return (
    <group>
      <Aim />
      {shots.map((shot, index) => (
        <Polaroid key={shot.id} shot={shot} shadow={shadow} order={index} />
      ))}
    </group>
  );
}

function Aim() {
  const { holding, setAimed, setHolding, setSection } = useStore();
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  const aimed = useRef<string | null>(null);
  const holdingRef = useRef(holding);
  holdingRef.current = holding;

  useFrame(() => {
    if (!holdingRef.current && !frameLock.on) {
      if (aimed.current) {
        aimed.current = null;
        frameLock.aimedId = null;
        setAimed(null);
      }
      return;
    }
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    let next: string | null = null;
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (typeof obj.userData.shotId === "string") {
          next = obj.userData.shotId;
          break;
        }
        obj = obj.parent;
      }
      if (next) break;
    }
    frameLock.aimedId = next;
    if (next !== aimed.current) {
      aimed.current = next;
      setAimed(next);
    }
  });

  useEffect(() => {
    const up = () => {
      if (!frameLock.on && !holdingRef.current) return;
      const shot = shots.find((item) => item.id === (aimed.current ?? frameLock.aimedId));
      frameLock.on = false;
      frameLock.aimedId = null;
      setHolding(false);
      setAimed(null);
      if (shot) setSection(shot.section, shot.id);
    };
    window.addEventListener("pointerup", up, true);
    return () => window.removeEventListener("pointerup", up, true);
  }, [setAimed, setHolding, setSection]);

  return null;
}
