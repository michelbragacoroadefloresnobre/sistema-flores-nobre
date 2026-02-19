import { ConversionMessageType } from "@/generated/prisma/enums";
import {
  getContactByPhoneNumber,
  listMessages,
  listSessions,
  sendTemplateSync,
} from "@/lib/helena";
import prisma from "@/lib/prisma";
import { isValidUUID } from "@/lib/utils";
import createHttpError from "http-errors";
import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log(body);

  const { formId } = body;

  try {
    const form = await prisma.form.findUnique({
      where: {
        id: formId,
      },
    });

    if (!form) throw new createHttpError.NotFound("Sessão não encontrada");

    const contact = await getContactByPhoneNumber(form.phone);

    const sessions = await listSessions({
      contactId: contact.id,
      createdAfter: DateTime.now().minus({ day: 1 }).toISO(),
    }).then((res) => res.items);

    if (sessions.length > 1) {
      console.info("Atendimento iniciado");
      return new NextResponse(null);
    }

    if (sessions.length > 1) {
      const messagesRes = await Promise.all(
        sessions.map((s) => listMessages(s.id)),
      );

      const messages = messagesRes.flatMap((m) => m.items);

      if (messages.some((m) => m.direction === "FROM_HUB")) {
        console.info("Atendimento iniciado");
        return new NextResponse(null);
      }
    }

    const template = await sendTemplateSync(
      form.phone,
      "87e1e_clientesemretorno",
    );

    await prisma.conversionMessage.create({
      data: {
        externalId: template.id,
        type: ConversionMessageType.SECOND_ATTEMPT,
        formId: form.id,
        sessionId: isValidUUID(template.sessionId)
          ? template.sessionId
          : undefined,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar segunda tentativa:", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    message: "Evento processado",
  });
}
