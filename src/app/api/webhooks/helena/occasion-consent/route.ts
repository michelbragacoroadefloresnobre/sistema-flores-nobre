import { handleOccasionConsentResponse } from "@/modules/occasions/occasion.service";
import { InviteStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type HelenaMessageReceivedEvent = {
  eventType: "MESSAGE_RECEIVED";
  content: {
    id: string;
    direction: "TO_HUB" | "FROM_HUB";
    sessionId: string;
    text: string | null;
    refId: string | null;
  };
};

export async function POST(req: NextRequest) {
  const data: HelenaMessageReceivedEvent = await req.json();

  console.log(
    "[Helena Occasion Consent]",
    JSON.stringify(data, null, 2),
  );

  if (data.eventType !== "MESSAGE_RECEIVED") {
    return new NextResponse(null, { status: 204 });
  }

  if (data.content.direction !== "FROM_HUB") {
    return new NextResponse(null, { status: 204 });
  }

  const { refId, text } = data.content;

  if (!refId || !text) {
    return new NextResponse(null, { status: 204 });
  }

  const panel = await prisma.customerPanel.findFirst({
    where: {
      consentMessageId: refId,
      inviteStatus: InviteStatus.SENT,
    },
  });

  if (!panel) {
    return new NextResponse(null, { status: 204 });
  }

  const normalizedText = text.trim().toLowerCase();
  const accepted = normalizedText === "sim";
  const declined =
    normalizedText === "não" || normalizedText === "nao";

  if (!accepted && !declined) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await handleOccasionConsentResponse(panel.id, accepted);
  } catch (e) {
    console.error("[Helena Occasion Consent] Erro:", e);
  }

  return new NextResponse(null, { status: 204 });
}
