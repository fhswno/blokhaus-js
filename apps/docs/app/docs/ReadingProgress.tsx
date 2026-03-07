"use client";

// REACT
import { useEffect, useRef, useState } from "react";

const ReadingProgress = () => {
  // States
  const [progress, setProgress] = useState<number>(0);

  // Ref
  const raf = useRef(0);

  // Effect - Update Progress on Scroll
  useEffect(() => {
    function update() {
      const scrollTop: number = window.scrollY;
      const docHeight: number =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    }

    function onScroll() {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "var(--color-fd-primary)",
          transformOrigin: "left",
          transform: `scaleX(${progress})`,
          transition: "transform 0.1s linear",
        }}
      />
    </div>
  );
};

export default ReadingProgress;
