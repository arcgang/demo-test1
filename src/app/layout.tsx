import type { ReactNode } from "react";
import "@/styles/globals.css";
import { SkipNavigation } from "@/components/accessibility/SkipNavigation";
import { LiveStatusAnnouncement } from "@/components/accessibility/LiveStatusAnnouncement";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SkipNavigation />
        <LiveStatusAnnouncement status="" />
        {children}
      </body>
    </html>
  );
}
