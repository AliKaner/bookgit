import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Booktions | Write, Branch, Publish Your Book",
  description: "A collaborative, git-style writing environment for modern authors. Branch your story, define your universe's lore, and write collaboratively.",
  applicationName: "Booktions",
  keywords: ["writing", "book writing", "authors", "collaboration", "storytelling", "git for writers", "bookgit", "booktions"],
  metadataBase: new URL("https://booktions.com"),
  openGraph: {
    title: "Booktions | The next generation writing platform",
    description: "Branch your chapters, organize your characters, and publish your world.",
    url: "https://booktions.com",
    siteName: "Booktions",
    images: [{ url: "/og-image.jpeg", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Booktions",
    description: "Write your masterpiece dynamically.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <LanguageProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
