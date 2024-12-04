import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/Header";

// Load custom fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Enhanced metadata
export const metadata: Metadata = {
  title: "Feature Flag DB Migration",
  description: "Gradually migrate your database with feature flags using Drizzle ORM and Next.js.",
  applicationName: "Feature Flag DB Migration POC",
  authors: [{ name: "Jackson Kasi", url: "https://github.com/jacksonkasi0" }],
  viewport: "width=device-width, initial-scale=1.0",
  keywords: ["Next.js", "Drizzle ORM", "Feature Flags", "Database Migration", "DevCycle"],
  themeColor: "#ffffff",
  colorScheme: "light dark",
  openGraph: {
    title: "Feature Flag DB Migration",
    description: "A POC for database migration using feature flags and Drizzle ORM.",
    url: "https://github.com/jacksonkasi0/geo-feature-flag-db-migration",
    siteName: "Feature Flag DB Migration POC",
    images: [
      {
        url: "/og-image.png", // Replace with OpenGraph image path
        width: 1200,
        height: 630,
        alt: "Feature Flag DB Migration",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Feature Flag DB Migration",
    description: "Learn how to migrate your database with feature flags and Drizzle ORM.",
    site: "@jacksonkasi11",
    creator: "@jacksonkasi11",
    images: ["/og-image.png"], // Replace with your Twitter card image path
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
