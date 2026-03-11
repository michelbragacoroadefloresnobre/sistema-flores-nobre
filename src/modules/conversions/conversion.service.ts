import { ConversionMessageType } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { cancelMessage, sendMessageSync, sendTemplateSync } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { scheduleUrlCall } from "@/lib/scheduler";
import { isValidUUID } from "@/lib/utils";
import createHttpError from "http-errors";

export async function sendInitialTemplate({
  phone,
  formId,
}: {
  phone: string;
  formId: string;
}) {
  const message = await sendMessageSync(phone, "🌹");
  let sessionId: string | undefined = undefined;

  console.info(`Mensagem enviada para o numero ${phone}:`);

  switch (message.status) {
    case "DELIVERED":
    case "SENT":
    case "PROCESSING": {
      if (isValidUUID(message.sessionId)) sessionId = message.sessionId;

      await prisma.conversionMessage.create({
        data: {
          sessionId,
          externalId: message.id,
          type: ConversionMessageType.WELLCOME,
          formId,
        },
      });

      await scheduleUrlCall({
        triggerIn: 6 * 60 * 60,
        url: `${env.NEXT_PUBLIC_WEBSITE_URL}/api/webhooks/conversions/feedback`,
        data: {
          formId: formId,
        },
      });

      break;
    }
    case "QUEUED": {
      await cancelMessage(message.id);
      const template = await sendTemplateSync(phone, "a85b1_formulariositefloresnobr");

      console.info(`Template enviado para o numero ${phone}:`);

      if (isValidUUID(template.sessionId)) sessionId = template.sessionId;
      else if (isValidUUID(message.sessionId)) sessionId = message.sessionId;

      await prisma.conversionMessage.create({
        data: {
          sessionId,
          externalId: template.id,
          type: ConversionMessageType.WELLCOME,
          formId,
        },
      });

      await scheduleUrlCall({
        triggerIn: 5 * 60,
        url: `${env.NEXT_PUBLIC_WEBSITE_URL}/api/webhooks/conversions/second-attempt`,
        data: {
          formId,
        },
      });
      await scheduleUrlCall({
        triggerIn: 6 * 60 * 60,
        url: `${env.NEXT_PUBLIC_WEBSITE_URL}/api/webhooks/conversions/feedback`,
        data: {
          formId: formId,
        },
      });

      break;
    }
    default:
      throw new createHttpError.BadRequest("Status desconhecido");
  }
}
