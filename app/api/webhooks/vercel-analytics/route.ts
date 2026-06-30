import { NextResponse } from "next/server";
import {
  processVercelAnalyticsEvents,
  verifyVercelDrainSecret,
  type VercelAnalyticsEvent,
} from "@/lib/integrations/vercel-analytics";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("org");
    const secret = url.searchParams.get("secret");

    if (!organizationId || !secret) {
      return NextResponse.json(
        { error: "Missing org or secret" },
        { status: 400 },
      );
    }

    const valid = await verifyVercelDrainSecret(organizationId, secret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const rawBody = await request.text();
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const events: VercelAnalyticsEvent[] = Array.isArray(payload)
      ? (payload as VercelAnalyticsEvent[])
      : [payload as VercelAnalyticsEvent];

    await processVercelAnalyticsEvents(organizationId, events);

    return NextResponse.json({ processed: events.length });
  } catch (error) {
    console.error("Vercel analytics webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 500 },
    );
  }
}
