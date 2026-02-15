export async function GET() {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  return Response.json({ 
    enabled: hasApiKey 
  });
}
