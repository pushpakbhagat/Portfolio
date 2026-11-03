"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A field of dots that behaves like a small neural network: dots near the pointer are pushed
 * aside, light up in the signal colour and link to their neighbours. Without a mouse (touch) a
 * virtual "scanner" wanders across the field instead, so phones get the effect too.
 * Canvas 2D, capped pixel ratio, paused when off-screen or in a background tab; a single static
 * frame when the visitor prefers reduced motion.
 */
export function NeuralField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const host = canvas.parentElement!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let width = 0;
    let height = 0;
    let points: { x: number; y: number }[] = [];
    let cols = 0;
    let colors = { dot: "", signal: "" };
    const pointer = { x: -9999, y: -9999, active: false };
    let frame = 0;
    let visible = true;

    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      colors = { dot: style.getPropertyValue("--foreground").trim(), signal: style.getPropertyValue("--signal").trim() };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = width < 640 ? 30 : 36;
      cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;
      points = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) points.push({ x: c * gap, y: r * gap });
    };

    const RADIUS = 170;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      // Touch / idle: a scanner drifting along a slow Lissajous path.
      let px = pointer.x;
      let py = pointer.y;
      if (!pointer.active) {
        px = width * (0.5 + 0.38 * Math.sin(time * 0.00021));
        py = height * (0.5 + 0.32 * Math.sin(time * 0.00033 + 1.3));
      }

      const moved: { x: number; y: number; near: number }[] = new Array(points.length);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const wave = Math.sin(p.x * 0.011 + time * 0.0007) * Math.cos(p.y * 0.013 + time * 0.0005) * 2.2;
        const dx = p.x - px;
        const dy = p.y - py;
        const dist = Math.hypot(dx, dy);
        const near = dist < RADIUS ? 1 - dist / RADIUS : 0;
        const push = near * near * 22;
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;
        moved[i] = { x: p.x + nx * push + wave, y: p.y + ny * push + wave, near };
      }

      // Links between neighbouring dots inside the pointer's radius.
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < moved.length; i++) {
        const a = moved[i];
        if (a.near <= 0.05) continue;
        for (const j of [i + 1, i + cols, i + cols + 1]) {
          const b = moved[j];
          if (!b || b.near <= 0.05 || (j === i + 1 && j % cols === 0)) continue;
          ctx.globalAlpha = Math.min(a.near, b.near) * 0.55;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const m of moved) {
        const lit = m.near > 0.05;
        ctx.globalAlpha = lit ? 0.25 + m.near * 0.75 : 0.16;
        ctx.fillStyle = lit ? colors.signal : colors.dot;
        const size = lit ? 1 + m.near * 1.6 : 1;
        ctx.fillRect(m.x - size / 2, m.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (time: number) => {
      draw(time);
      if (visible && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (reduced) draw(0);
      else frame = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    readColors();
    resize();
    start();

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(host);
    // Re-read colours when the theme flips (the html class changes).
    const mo = new MutationObserver(() => {
      readColors();
      if (reduced) draw(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onVisibility = () => !document.hidden && visible && start();
    document.addEventListener("visibilitychange", onVisibility);
    if (finePointer && !reduced) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0", className)} />;
}
