import { ConversionMessageType } from "@/generated/prisma/enums";
import { sendMessage } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type WebhookEvent = {
  eventType: string;
  date: string;
  content: {
    id: string;
    companyId: string;
    senderId: string | null;
    createdAt: string;
    updatedAt: string;
    editedAt: string | null;
    type: string;
    active: boolean;
    sessionId: string;
    templateId: string | null;
    userId: string | null;
    timestamp: string;
    text: string | null;
    direction: "TO_HUB" | "FROM_HUB";
    status: string;
    origin: string;
    readContactAt: string | null;
    fileId: string | null;
    refId: string | null;
    waitingOptIn: boolean;
    details: {
      to?: string;
      from?: string;
      file: unknown;
      location: unknown;
      contact: unknown;
      errors: unknown;
      transcription: string | null;
      templateCategoryId: string | null;
      templateCategoryName: string | null;
    };
  };
  changeMetadata: unknown;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as WebhookEvent;
  if (body.eventType !== "MESSAGE_RECEIVED" || !body.content?.refId)
    return new NextResponse(null, { status: 204 });

  console.log(body);

  const templateId = body.content.refId;

  try {
    const forms = await prisma.form.updateManyAndReturn({
      data: {
        cancelReason: body.content.text,
      },
      where: {
        conversionMessages: {
          some: {
            externalId: templateId,
            type: ConversionMessageType.FEEDBACK,
          },
        },
      },
    });

    if (!forms[0]) {
      console.info("Nenhum formulario encontrado");
      return;
    }

    await sendMessage(forms[0].phone, "Obrigado pelo seu feedback!");
  } catch (e: any) {
    if (e.code !== "P2025") console.error("Erro ao registrar resposta:", e);
  }

  return NextResponse.json(
    { message: "Mensagem processada com sucesso" },
    { status: 200 },
  );
}
