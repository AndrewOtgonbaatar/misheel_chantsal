"use client";

import { useEffect, useState } from "react";
import { contact, sections, shots, type SectionId } from "@/data/portfolio";
import { CAMERA, PHOTO } from "@/components/scene/layout";
import { useStore } from "@/components/store";
import { AboMark } from "@/components/ui/abo-mark";
import "@/styles/chrome.css";

const order: SectionId[] = [
  "about",
  "sports",
  "service",
  "school",
  "medicine",
  "awards",
];

function arrowGrow(width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  let fov = CAMERA.fov;
  let depth = CAMERA.z;
  if (width < 520 || aspect < 0.7) {
    fov = 42;
    depth = 11.2;
  } else if (width < 860 || aspect < 1) {
    fov = 36;
    depth = 10.5;
  } else if (width < 1400) {
    fov = 33;
    depth = 10.4;
  } else if (aspect > 2.1) {
    fov = 24;
    depth = 9.55;
  }
  const narrow = width < 860;
  const spotScale = width < 520 ? 1.22 : narrow ? 1.45 : height < 760 ? 1.7 : 1.95;
  const visibleHeight = 2 * Math.tan((fov * Math.PI) / 360) * depth;
  return ((PHOTO.w / 2) * spotScale * height) / visibleHeight;
}

export function Chrome() {
  const { section, selectedId, spotlight, zoom, setSection, closeSpotlight, showPhoto, setZoom, holding } =
    useStore();
  const story = sections.find((item) => item.id === section);
  const selected = shots.find((shot) => shot.id === selectedId);
  const group = section ? shots.filter((shot) => shot.section === section) : [];
  const canStep = group.length > 1;
  const [nudge, setNudge] = useState({ dir: 0, tick: 0 });
  const [grow, setGrow] = useState(170);

  const movePhoto = (direction: 1 | -1) => {
    if (!canStep) return;
    const index = Math.max(0, group.findIndex((shot) => shot.id === selectedId));
    const next = group[(index + direction + group.length) % group.length];
    showPhoto(next.id);
    setNudge((current) => ({ dir: direction, tick: current.tick + 1 }));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (spotlight) closeSpotlight();
        else setSection(null);
        return;
      }
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const index = section ? order.indexOf(section) : -1;
      const next =
        event.key === "ArrowRight"
          ? order[(index + 1) % order.length]
          : order[(index - 1 + order.length) % order.length];
      setSection(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [section, spotlight, setSection, closeSpotlight]);

  useEffect(() => {
    const update = () => setGrow(arrowGrow(window.innerWidth, window.innerHeight));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!spotlight) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      setZoom((current) => current - event.deltaY * unit * 0.0016);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [spotlight, setZoom]);

  return (
    <div
      className={`chrome${holding ? " is-holding" : ""}${spotlight ? " is-spotlight" : ""}`}
      style={{ ["--spot-zoom" as string]: zoom, ["--arrow-grow" as string]: `${grow}px` }}
    >
      <header className="top">
        <h1>
          <button type="button" className="brand" onClick={() => setSection(null)}>
            <span>Misheel</span>
            <span>Chantsal</span>
          </button>
        </h1>
        {section ? (
          <button type="button" className="back" onClick={() => setSection(null)}>
            Back
          </button>
        ) : null}
        <nav className="nav" aria-label="Sections">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => setSection(section === item.id ? null : item.id)}
            >
              {item.nav}
            </button>
          ))}
        </nav>
      </header>

      {spotlight && story ? (
        <>
          <button type="button" className="exit" onClick={closeSpotlight} aria-label="Close photo">
            ×
          </button>
          <p className="caption" aria-hidden={zoom > 1.35}>
            <strong>{selected?.label ?? story.title}</strong>
            <span>{story.lede}</span>
          </p>
        </>
      ) : story ? (
        <article className="story" aria-label={story.nav}>
          <h2>{story.title}</h2>
          <p>{story.lede}</p>
          <ul>
            {story.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          {story.id === "about" ? (
            <p className="contact">
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <a href={`tel:${contact.phone}`}>{contact.phoneLabel}</a>
              <a href={contact.resume} target="_blank" rel="noreferrer">
                Resume
              </a>
            </p>
          ) : null}
        </article>
      ) : (
        <p className="hint">Drag a photo, or pick a section. Double-click to focus one.</p>
      )}

      {spotlight ? (
        <>
          <button
            type="button"
            className="step prev"
            disabled={!canStep}
            aria-label="Previous photo"
            onClick={() => movePhoto(-1)}
          >
            <span key={nudge.dir === -1 ? nudge.tick : "prev"} className={nudge.dir === -1 ? "is-nudged" : undefined}>
              <Chevron dir="prev" />
            </span>
          </button>
          <button
            type="button"
            className="step next"
            disabled={!canStep}
            aria-label="Next photo"
            onClick={() => movePhoto(1)}
          >
            <span key={nudge.dir === 1 ? nudge.tick : "next"} className={nudge.dir === 1 ? "is-nudged" : undefined}>
              <Chevron dir="next" />
            </span>
          </button>
        </>
      ) : null}

      <div className="finder" aria-hidden="true">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <span className="reticle" />
        <span className="readout">ISO 200 · f/4 · 1/125</span>
      </div>

      <div className="grain" />
      <AboMark className="abo-mark" />
    </div>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === "prev" ? "M14.5 6 8.5 12l6 6" : "M9.5 6 15.5 12l-6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
