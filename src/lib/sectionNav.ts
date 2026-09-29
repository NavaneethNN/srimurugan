"use client";

import { useCallback } from "react";

const SECTION_PATHS = [
  "/home",
  "/now-showing",
  "/coming-soon",
  "/features",
  "/order-food",
  "/about",
  "/gallery",
  "/contact",
];

function pathToId(path: string): string {
  const id = path.replace("/", "");
  return id;
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function useSectionNav() {
  const handleNav = useCallback((e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (window.location.pathname !== "/") {
      e.preventDefault();
      const id = pathToId(path);
      window.location.href = `/?section=${encodeURIComponent(id)}`;
      return;
    }

    e.preventDefault();
    const id = pathToId(path);
    scrollToSection(id);
    window.history.pushState(null, "", path);
  }, []);

  return { handleNav };
}

export function navigateToSectionFromPath(pathname: string) {
  if (pathname === "/" || pathname === "") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const id = pathToId(pathname);
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export { SECTION_PATHS };
