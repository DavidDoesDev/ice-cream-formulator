import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.scss";
import { DevTools } from "@/devtools/DevTools";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Ice Cream Lab",
  description: "A test kitchen for frozen formulas",
};

// Zoom the mobile viewport out ~10% app-wide, so dense layouts (cone callouts,
// wide readouts) have room on small screens. initial-scale is honoured on
// touch/mobile browsers and ignored on desktop, so it only affects small screens.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.85,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Resolve the theme before first paint (same logic as Header) so the
            page renders in the stored/system theme immediately instead of
            painting a default and then transitioning. Runs synchronously during
            HTML parsing; no data-theme is set on <html> server-side so the CSS
            media query stays a graceful no-JS fallback. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=(t==="light"||t==="dark")?t:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",d);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {/* Page content lives in its own shell so it can recede into z-space
            when a modal opens. The Modal portals to <body>, outside this shell,
            so it stays crisp while everything behind it sinks back. */}
        <div className="app-shell">{children}</div>
        <div className="grain" aria-hidden />
        <DevTools />
      </body>
    </html>
  );
}
