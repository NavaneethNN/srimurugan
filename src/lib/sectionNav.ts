"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

const SECTION_PATHS = [
  "/home",
  "/now-showing",
  "/coming-soon",
  "/features",
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
  const router = useRouter();

  const handleNav = useCallback((e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    // If navigating to standalone pages like /order-food, don't intercept with section scroll
    if (path === "/order-food") {
      return;
    }

    if (window.location.pathname !== "/") {
      e.preventDefault();
      const id = pathToId(path);
      router.push(`/?section=${encodeURIComponent(id)}`);
      return;
    }

    e.preventDefault();
    const id = pathToId(path);
    scrollToSection(id);
    window.history.pushState(null, "", path);
  }, [router]);

  return { handleNav };
}

export function navigateToSectionFromPath(pathname: string) {
  if (pathname === "/" || pathname === "" || pathname.startsWith("/order-food")) {
    if (pathname === "/" || pathname === "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }
  const id = pathToId(pathname);
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export { SECTION_PATHS };
