import { FormStatus, FormType } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { validateEmail } from "@/lib/utils";
import { sendInitialTemplate } from "@/modules/conversions/conversion.service";
import { subDays } from "date-fns";
import createHttpError, { isHttpError } from "http-errors";
import { NextResponse } from "next/server";

export interface CampaignData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gad_source?: string;
  gad_campaignid?: string;
  gbraid?: string;
  gclid?: string;
  wbraid?: string;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log(body);

    const name = body.name?.trim() || "";
    const email = body.email?.trim()?.toLowerCase();
    const phone = body.phone?.trim() || "";
    const sourceData = body.sourceData || "";

    let campaignData: CampaignData | undefined;
    try {
      campaignData = body.campaignData
        ? JSON.parse(body.campaignData)
        : undefined;
    } catch (e) {
      console.error("Erro ao fazer parse do utm:", e);
    }

    if (!name || name.length < 2)
      throw new createHttpError.BadRequest("Informe o nome completo");
    if (!email || !validateEmail(email))
      throw new createHttpError.BadRequest("Email valido");
    if (!phone || !/^\d{12,13}$/.test(phone))
      throw new createHttpError.BadRequest("Telefone invalido");

    const last24Hours = subDays(new Date(), 1);

    const orCount = await prisma.form.count({
      where: {
        phone: phone,
        createdAt: { gte: last24Hours },
      },
    });

    if (orCount) {
      console.info("Já preencheu formulario");
      return NextResponse.json(
        {
          message: "Já preencheu formulario",
        },
        {
          headers: CORS_HEADERS,
        },
      );
    }

    const isCustomer = await prisma.form.count({
      where: {
        phone,
        status: FormStatus.CONVERTED,
        createdAt: { lt: subDays(new Date(), 1) },
      },
    });

    const form = await prisma.form.create({
      data: {
        name,
        email,
        phone,
        isCustomer: !isCustomer,
        type: FormType.FORM_FN,
        status: FormStatus.NOT_CONVERTED,
        source: sourceData || campaignData?.utm_source || undefined,
      },
    });

    try {
      await sendInitialTemplate({ phone, formId: form.id });
    } catch (e) {
      if (isHttpError(e)) console.warn(e.message);
      else console.error("Erro ao enviar mensagem:", e);
    }

    return NextResponse.json(
      {
        message: "Formulario registrado com sucesso",
      },
      { headers: CORS_HEADERS, status: 201 },
    );
  } catch (error) {
    if (!isHttpError(error))
      console.error("Erro desconhecido ao salvar formulario:", error);
    return NextResponse.json(
      {
        error: isHttpError(error)
          ? error.message
          : "Algo deu errado. Contate o suporte",
      },
      { headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
