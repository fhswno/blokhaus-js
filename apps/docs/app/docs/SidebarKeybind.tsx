"use client";

// REACT
import { useEffect } from "react";

// FUMADOCS
import { useSidebar } from "fumadocs-ui/contexts/sidebar";

const SidebarKeybind = () => {
  const { setCollapsed } = useSidebar();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "[") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCollapsed]);

  return null;
};

export default SidebarKeybind;
