import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiveSpace — Virtual Classroom",
  description:
    "Real-time virtual classroom with video conferencing, collaborative whiteboard, live polling, and chat — powered by LiveKit.",
  keywords: ["virtual classroom", "video conferencing", "whiteboard", "livekit", "polling"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
