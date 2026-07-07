import type { Metadata } from "next";
import { Bricolage_Grotesque, Anton, Space_Mono } from "next/font/google";
import "./globals.scss";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${anton.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
