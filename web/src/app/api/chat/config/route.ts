export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  return Response.json({
    enabled: !!key
  });
}
