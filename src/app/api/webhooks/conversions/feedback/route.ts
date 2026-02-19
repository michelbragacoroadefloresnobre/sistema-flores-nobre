import { ConversionMessageType, FormStatus } from "@/generated/prisma/client";
import { sendTemplateSync } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { isValidUUID } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log(body);

  const { formId } = body;

  try {
    const form = await prisma.form.findUnique({
      where: { id: formId, status: FormStatus.NOT_CONVERTED },
    });

    if (!form) {
      console.log("Formulario indisponivel");
      return new NextResponse(null);
    }

    const template = await sendTemplateSync(form.phone, "960a8_leadperdido");

    await prisma.conversionMessage.create({
      data: {
        externalId: template.id,
        type: ConversionMessageType.FEEDBACK,
        formId: form.id,
        sessionId: isValidUUID(template.sessionId)
          ? template.sessionId
          : undefined,
      },
    });

    return NextResponse.json({
      message: "Template enviado com sucesso",
    });
  } catch (error: any) {
    console.error(error?.message);
    return NextResponse.json(
      {
        error: "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
