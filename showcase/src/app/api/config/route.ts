import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    authRequired: !!process.env.AUTH_PASSWORD,
    apiUrl: process.env.API_URL || 'http://api:4000',
  });
}
