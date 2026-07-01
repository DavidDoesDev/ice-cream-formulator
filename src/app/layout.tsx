import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.scss";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "Ice Cream Formulator",
  description: "Ice cream recipe and formula tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={bricolage.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
