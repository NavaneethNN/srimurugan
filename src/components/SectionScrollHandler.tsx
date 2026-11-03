"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { navigateToSectionFromPath } from "@/lib/sectionNav";

export default function SectionScrollHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const section = searchParams.get("section");
    if (pathname === "/" && section) {
      const timer = setTimeout(() => {
        navigateToSectionFromPath(`/${section}`);
      }, 50);
      return () => clearTimeout(timer);
    }

    if (pathname && pathname !== "/") {
      const timer = setTimeout(() => {
        navigateToSectionFromPath(pathname);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  return null;
}
