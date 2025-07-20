import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Ads from "./components/Ads";
import Script from "next/script"; // Add this import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CelebGuessr",
  description: "A celebrity guessing game!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          strategy="afterInteractive"
        />
        {children}
        <Ads />
      </body>
    </html>
  );
}