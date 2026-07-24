"use client";

import { useInView } from "@/lib/useInView";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
  delay?: number;
  threshold?: number;
}

export default function Reveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  threshold = 0.15,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(threshold);

  const directionClass =
    direction === "left" ? "from-left" : direction === "right" ? "from-right" : "";

  return (
    <div
      ref={ref}
      className={`reveal-group ${directionClass} ${inView ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
