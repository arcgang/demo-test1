import type { ReactNode } from "react";
import "@/styles/globals.css";
import { SkipNavigation } from "@/components/accessibility/SkipNavigation";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SkipNavigation />
        {children}
      </body>
    </html>
  );
}
