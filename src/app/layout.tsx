import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollabBook - Collaborative Book Writing Platform",
  description: "Join CollabBook to write books together, create infinite story branches, and explore community-driven narratives. The ultimate platform for collaborative storytelling and interactive fiction.",
  keywords: ["collaborative writing", "write book online", "branching narrative", "storytelling platform", "fanfiction", "creative writing", "co-authoring", "interactive stories", "choose your own adventure"],
  openGraph: {
    title: "CollabBook - Write Together, Branch Infinite Stories",
    description: "The first collaborative book platform where every chapter is a choice. Write the canonical story or branch off into your own universe.",
    type: "website",
    siteName: "CollabBook",
    images: [
      {
        url: '/android-chrome-512x512.png', // Using high-res icon as OG image fallback
        width: 512,
        height: 512,
        alt: 'CollabBook Logo',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CollabBook - Collaborative Storytelling",
    description: "Write together. Branch infinite stories.",
    images: ['/android-chrome-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
