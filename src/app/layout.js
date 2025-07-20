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

export const metadata = {
  title: "CelebGuessr",
  description: "A celebrity guessing game!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script async custom-element="amp-ad" src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <amp-ad width="100vw" height="320"
          type="adsense"
          data-ad-client="ca-pub-8419504558731883"
          data-ad-slot="8577910669"
          data-auto-format="rspv"
          data-full-width="">
          <div overflow=""></div>
        </amp-ad>
      </body>
    </html>
  );
}
