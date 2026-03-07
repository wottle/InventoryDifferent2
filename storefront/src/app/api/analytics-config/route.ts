import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    url: process.env.UMAMI_URL || "",
    websiteId: process.env.UMAMI_WEBSITE_ID || "",
  });
}
