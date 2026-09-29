"use client";

import { useEffect } from "react";
import { navigateToSectionFromPath } from "@/lib/sectionNav";

export default function SectionScrollHandler() {
  useEffect(() => {
    const path = window.location.pathname;
    const section = new URLSearchParams(window.location.search).get("section");
    if (path === "/" && section) {
      const timer = setTimeout(() => {
        navigateToSectionFromPath(`/${section}`);
      }, 100);
      return () => clearTimeout(timer);
    }

    if (path && path !== "/") {
      const timer = setTimeout(() => {
        navigateToSectionFromPath(path);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
