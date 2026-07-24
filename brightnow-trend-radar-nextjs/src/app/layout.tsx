import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrightNow Trend Radar",
  description:
    "BrightNow squad workspace for collecting trends, actions, and learnings.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
