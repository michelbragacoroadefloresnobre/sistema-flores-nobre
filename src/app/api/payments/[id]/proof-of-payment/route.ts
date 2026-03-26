import { PaymentStatus } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { sendPromotionalMessage } from "@/modules/payments/payment.service";
import createHttpError from "http-errors";
import z from "zod";

export const POST = createRoute(
  async (req, { body, params }) => {
    const imageUrl = `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${body.fileKey}`;
    const fileUrlResponse = await fetch(imageUrl);

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

    const contentType = fileUrlResponse.headers.get("Content-Type") || "";

    if (!allowedImageTypes.includes(contentType))
      throw new createHttpError.BadRequest("Formato de imagem incompativel");

    const {id} = params

    const { count } = await prisma.payment.updateMany({
      data: {
        proofOfPaymentUrl: imageUrl,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
      where: {
        proofOfPaymentUrl: null,
        status: PaymentStatus.ACTIVE,
        id
      },
    });

    if (!count)
      throw new createHttpError.BadRequest(
        "Envio de foto indisponivel para este pagamento",
      );

    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id },
      include: { order: { include: { contact: true } } },
    });

    sendPromotionalMessage(payment.order.contact.phone, payment.order.id)
      .catch((e) => console.error("[Promocional] Erro ao enviar:", e));

    return "Foto enviada com sucesso";
  },
  {
    body: z.object({
      fileKey: z.string().min(1),
    }),
  },
);
