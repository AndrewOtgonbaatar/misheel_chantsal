"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { shots } from "@/data/portfolio";
import { StoreProvider } from "@/components/store";
import { Chrome } from "@/components/ui/chrome";
import { Loader } from "@/components/ui/loader";

const Stage = dynamic(() => import("@/components/scene/stage"), { ssr: false });

export default function Portfolio() {
  const [progress, setProgress] = useState(8);
  const [sceneReady, setSceneReady] = useState(false);
  const [minTime, setMinTime] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinTime(true), 800);
    const sources = [...new Set(shots.map((shot) => shot.src))];
    let done = 0;
    sources.forEach((src) => {
      const image = new Image();
      const finish = () => {
        done += 1;
        setProgress(Math.max(8, Math.round((done / sources.length) * 100)));
      };
      image.onload = finish;
      image.onerror = finish;
      image.src = src;
    });
    return () => window.clearTimeout(timer);
  }, []);

  const ready = progress === 100 && sceneReady && minTime;

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setShowLoader(false), 650);
    return () => window.clearTimeout(timer);
  }, [ready]);

  return (
    <StoreProvider>
      <main className="portfolio">
        <Stage onReady={() => setSceneReady(true)} />
        <Chrome />
        {showLoader ? <Loader progress={progress} leaving={ready} /> : null}
      </main>
    </StoreProvider>
  );
}
