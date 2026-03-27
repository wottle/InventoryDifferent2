"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Configure this to your storefront domain if you use legacy hash-based URLs
const SHOP_DOMAIN = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname.replace(/^[^.]+/, "shop")}:3001`
    : "";

export function LegacyRedirect() {
    const router = useRouter();

    useEffect(() => {
        const hash = window.location.hash;
        
        if (!hash.startsWith("#!/")) {
            return;
        }

        const path = hash.slice(2); // Remove "#!"

        // /#!/devices/store/<id> -> shop subdomain /item/<id>
        const storeDetailMatch = path.match(/^\/devices\/store\/(\d+)$/);
        if (storeDetailMatch) {
            window.location.href = `${SHOP_DOMAIN}/item/${storeDetailMatch[1]}`;
            return;
        }

        // /#!/devices/store -> shop subdomain
        if (path === "/devices/store") {
            window.location.href = SHOP_DOMAIN;
            return;
        }

        // /#!/devices/list -> /
        if (path === "/devices/list") {
            router.replace("/");
            return;
        }

        // /#!/devices/<id> -> /devices/<id>
        const deviceDetailMatch = path.match(/^\/devices\/(\d+)$/);
        if (deviceDetailMatch) {
            router.replace(`/devices/${deviceDetailMatch[1]}`);
            return;
        }
    }, [router]);

    return null;
}
