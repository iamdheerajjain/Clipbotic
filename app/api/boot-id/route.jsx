const BOOT_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function GET() {
  return Response.json({ bootId: BOOT_ID });
}
