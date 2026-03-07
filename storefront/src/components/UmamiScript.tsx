"use client";

import Script from "next/script";
import { useState, useEffect } from "react";

export function UmamiScript() {
  const [config, setConfig] = useState<{ url: string; websiteId: string } | null>(null);

  useEffect(() => {
    fetch("/api/analytics-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.url && data.websiteId) {
          setConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  if (!config) return null;

  return (
    <Script
      defer
      src={`${config.url}/script.js`}
      data-website-id={config.websiteId}
      strategy="afterInteractive"
    />
  );
}
