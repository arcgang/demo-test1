import React from "react";

export interface SkipNavigationProps {
  targetId?: string;
  label?: string;
}

export function SkipNavigation({
  targetId = "main-content",
  label = "Skip to main content",
}: SkipNavigationProps) {
  return (
    <a href={`#${targetId}`} className="skip-nav">
      {label}
    </a>
  );
}
