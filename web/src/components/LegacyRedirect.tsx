"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SHOP_DOMAIN = "https://shop.inventorydifferent.com";

export function LegacyRedirect() {
    const router = useRouter();

    useEffect(() => {
        const hash = window.location.hash;
        
        if (!hash.startsWith("#!/")) {
            return;
        }

        const path = hash.slice(2); // Remove "#!"

        // /#!/devices/store/<id> -> shop.inventorydifferent.com/item/<id>
        const storeDetailMatch = path.match(/^\/devices\/store\/(\d+)$/);
        if (storeDetailMatch) {
            window.location.href = `${SHOP_DOMAIN}/item/${storeDetailMatch[1]}`;
            return;
        }

        // /#!/devices/store -> shop.inventorydifferent.com
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
