import { PaymentStatus } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { finishOrder } from "@/modules/orders/order.service";
import createHttpError from "http-errors";
import z from "zod";

export const POST = createRoute(
  async (req, { body, params }) => {
    const imageUrl = `${env.AWS_S3_CLOUDFRONT_URL}/${body.fileKey}`;
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

    finishOrder(payment.orderId).catch(() => {});

    return "Foto enviada com sucesso";
  },
  {
    body: z.object({
      fileKey: z.string().min(1),
    }),
  },
);
