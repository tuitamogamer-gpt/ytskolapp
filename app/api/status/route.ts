// Status ruta — javlja da li je AI dostupan (da li je postavljen ANTHROPIC_API_KEY).

import { NextResponse } from "next/server";
import { aiAvailable } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ aiAvailable: aiAvailable() });
}
