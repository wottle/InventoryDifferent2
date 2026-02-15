"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface DeepLinkBannerProps {
  deviceId?: string;
}

export function DeepLinkBanner({ deviceId }: DeepLinkBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true;
    const bannerDismissed = sessionStorage.getItem("deeplink-banner-dismissed");

    if (isIOS && !isStandalone && !bannerDismissed && deviceId) {
      setShowBanner(true);
    }
  }, [deviceId]);

  const handleOpenApp = () => {
    const appUrl = `inventorydifferent://devices/${deviceId}`;
    window.location.href = appUrl;
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem("deeplink-banner-dismissed", "true");
  };

  if (!showBanner || dismissed) {
    return null;
  }

  return (
    <>
      {/* Fixed banner at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Open in InventoryDifferent App</p>
                <p className="text-xs opacity-90 truncate">Get the full experience</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleOpenApp}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                Open
              </button>
              <button
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Spacer to push content down */}
      <div className="h-[72px]" aria-hidden="true" />
    </>
  );
}
