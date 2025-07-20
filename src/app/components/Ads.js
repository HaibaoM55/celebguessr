// app/components/Ads.js
"use client";

import { useEffect } from "react";

export default function Ads() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ignore errors if adsbygoogle is not ready yet
      console.error(e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", width: "100%", height: "320px" }}
      data-ad-client="ca-pub-8419504558731883"
      data-ad-slot="8577910669"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}
