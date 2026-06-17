import { NextResponse } from "next/server";
import { dispatchWebhook } from "@/lib/webhooks/dispatch";
import { verifyWebhook } from "@/lib/webhooks/verify";

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await context.params;
    const rawBody = await request.text();
    const event = await verifyWebhook(provider, request, rawBody);
    const result = await dispatchWebhook(event);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 400 },
    );
  }
}
