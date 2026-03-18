import { ConversionMessageType } from "@/generated/prisma/enums";
import { cancelMessage, sendMessageSync, sendTemplateSync } from "@/lib/helena";
import prisma from "@/lib/prisma";
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

      break;
    }
    case "QUEUED": {
      await cancelMessage(message.id);
      const template = await sendTemplateSync(phone, "77dca_formulariositevariavelno");

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
      break;
    }
    default:
      throw new createHttpError.BadRequest("Status desconhecido");
  }
}
