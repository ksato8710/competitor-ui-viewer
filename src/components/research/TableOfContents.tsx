"use client";

import { useState, useEffect } from "react";
import type { ResearchSection } from "@/lib/types";

export default function TableOfContents({
  sections,
}: {
  sections: ResearchSection[];
}) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">
        目次
      </p>
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`block text-sm py-1 px-2 rounded transition-colors ${
            activeId === section.id
              ? "text-accent-blue font-medium bg-active-bg"
              : "text-text-dim hover:text-text-primary hover:bg-bg-hover"
          }`}
        >
          {section.title}
        </a>
      ))}
    </nav>
  );
}
