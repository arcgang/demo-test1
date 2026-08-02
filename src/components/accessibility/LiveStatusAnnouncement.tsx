import React from "react";

export interface LiveStatusAnnouncementProps {
  status: string;
  className?: string;
}

export function LiveStatusAnnouncement({
  status,
  className,
}: LiveStatusAnnouncementProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={className}
    >
      {status}
    </div>
  );
}
