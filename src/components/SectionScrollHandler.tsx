"use client";

import { useEffect } from "react";
import { navigateToSectionFromPath } from "@/lib/sectionNav";

export default function SectionScrollHandler() {
  useEffect(() => {
    const path = window.location.pathname;
    if (path && path !== "/") {
      const timer = setTimeout(() => {
        navigateToSectionFromPath(path);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
