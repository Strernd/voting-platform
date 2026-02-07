import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const bahnschrift = localFont({
  src: "../fonts/bahnschrift.ttf",
  variable: "--font-bahnschrift",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bundes Heimbrau Spiele",
  description: "Stimme für dein Lieblingsbier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${bahnschrift.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
