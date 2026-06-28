import type { Metadata } from "next";
import "./globals.scss";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
