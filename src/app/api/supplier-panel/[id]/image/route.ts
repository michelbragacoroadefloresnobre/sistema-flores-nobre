import {
  LogType,
  OrderStatus,
  SupplierPanelStatus,
} from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import { sendMessage } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { scheduleUrlCall } from "@/lib/scheduler";
import { sendMessageToSupplier } from "@/lib/zapi";
import { convertHeicToJpeg } from "@/modules/files/file.service";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import createHttpError from "http-errors";
import z from "zod";

export const POST = createRoute(
  async (req, { params, body, auth }) => {
    const fileUrlResponse = await fetch(
      `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${body.fileKey}`,
    );

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    const contentType = fileUrlResponse.headers.get("Content-Type") || "";

    if (!allowedImageTypes.includes(contentType))
      throw new createHttpError.BadRequest("Formato de imagem incompativel");

    let name = body.fileKey;
    let type = contentType;
    if (type === "image/heic" || type === "image/heif") {
      const fileBuffer = await convertHeicToJpeg(
        await fileUrlResponse.arrayBuffer(),
      );
      name = name.replace(/\.(heic|heif)$/i, ".jpg");
      type = "image/jpeg";
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: body.fileKey,
        }),
      );
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: name,
          Body: Buffer.from(fileBuffer),
          ContentType: type,
        }),
      );
    }

    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${name}`;

    await prisma.$transaction(async (tx) => {
      const orders = await tx.order.updateManyAndReturn({
        data: {
          orderStatus: OrderStatus.PRODUCING_CONFIRMATION,
        },
        where: {
          orderStatus: OrderStatus.PRODUCING_PREPARATION,
          supplierPanels: { some: { id: params.id } },
        },
        select: { id: true },
      });

      if (!orders[0])
        throw new createHttpError.BadRequest(
          "Envio de foto indisponivel para este pedido",
        );

      const { count } = await tx.supplierPanel.updateMany({
        data: {
          imageUrl,
        },
        where: {
          id: params.id,
          status: SupplierPanelStatus.CONFIRMED,
        },
      });

      if (!count)
        throw new createHttpError.BadRequest(
          "Envio de foto indisponivel para este painel",
        );

      const order = orders[0];

      const supplier = await tx.supplier.findFirst({
        where: {
          supplierPanels: { some: { id: params.id } },
        },
        select: { name: true },
      });

      await tx.auditLog.create({
        data: {
          orderId: order.id,
          author: auth?.user.name || supplier?.name || "Sistema",
          action: "Enviou foto",
          type: LogType.STATUS_CHANGE,
          description: `Pedido teve foto anexada -> ${imageUrl}`,
        },
      });
    });

    return "Foto enviada com sucesso";
  },
  { public: true, body: z.object({ fileKey: z.string().min(1) }) },
);

export const PUT = createRoute(
  async (req, { body, params }) => {
    if (body.action === "approve") {
      const { count } = await prisma.order.updateMany({
        data: {
          orderStatus: OrderStatus.DELIVERING_ON_ROUTE,
        },
        where: {
          orderStatus: OrderStatus.PRODUCING_CONFIRMATION,
          supplierPanels: {
            some: {
              id: params.id,
              status: SupplierPanelStatus.CONFIRMED,
              imageUrl: { not: null },
            },
          },
        },
      });

      if (!count)
        throw new createHttpError.BadRequest(
          "Esta ação não está mais disponivel",
        );

      const supplierPanel = await prisma.supplierPanel.findUniqueOrThrow({
        where: { id: params.id },
        include: { supplier: true, order: { include: { contact: true } } },
      });

      try {
        await scheduleUrlCall({
          triggerAt: supplierPanel.order.deliveryUntil,
          url: `${process.env
            .NEXT_PUBLIC_WEBSITE_URL!}/api/webhooks/orders/warn-late-order`,
          data: {
            panelId: supplierPanel.id,
          },
        });
      } catch (e: any) {
        console.error("Erro ao agendar pedido atrasado", e.response?.data);
      }

      try {
        if (supplierPanel.supplier.jid)
          await sendMessageToSupplier(
            supplierPanel.supplier.jid,
            `✅ Sua foto foi aprovada e liberada para entrega. Por favor, confirme a entrega pelo painel abaixo:\n${env.NEXT_PUBLIC_WEBSITE_URL}/painel/${supplierPanel.id}\n\nPedido:\n *#NOBRE${supplierPanel.orderId}*`,
          );
      } catch (e: any) {
        console.error(
          "Erro ao enviar confirmação de aprovação:",
          e.response?.data || e,
        );
        return "Foto aprovada com sucesso, mas houve um erro ao enviar notificação para o fornecedor";
      }

      try {
        await sendMessage(
          supplierPanel.order.contact.phone,
          `*🚚 Pedido a caminho*\nSeu pedido já saiu para entrega e chegará em breve ao destino.\n\nPedido: #NOBRE${supplierPanel.orderId}`,
          supplierPanel.imageUrl!,
        );
      } catch (e) {
        console.error("Erro ao enviar foto para cliente:", e);
      }

      return "Foto aprovada com sucesso";
    } else if (body.action === "reject") {
      const { count } = await prisma.order.updateMany({
        data: {
          orderStatus: OrderStatus.PRODUCING_PREPARATION,
        },
        where: {
          orderStatus: OrderStatus.PRODUCING_CONFIRMATION,
          supplierPanels: {
            some: {
              id: params.id,
              status: SupplierPanelStatus.CONFIRMED,
              imageUrl: { not: null },
            },
          },
        },
      });

      if (!count)
        throw new createHttpError.BadRequest(
          "Esta ação não está mais disponivel",
        );

      const supplierPanel = await prisma.supplierPanel.findUnique({
        where: { id: params.id },
        include: { supplier: true },
      });

      try {
        if (supplierPanel?.supplier.jid)
          await sendMessageToSupplier(
            supplierPanel.supplier.jid,
            `❌ A foto enviada foi rejeitada pelo seguinte motivo:\n*${body.reason}*\n\nPor favor, envie uma nova foto pelo painel abaixo:\n${env.NEXT_PUBLIC_WEBSITE_URL}/painel/${supplierPanel.id}\n\nPedido:\n *#NOBRE${supplierPanel.orderId}*`,
          );
      } catch (e: any) {
        console.error("Erro ao rejeitar foto:", e.response?.data || e);
        return "Foto rejeitada com sucesso, mas houve um erro ao enviar notificação para o fornecedor";
      }

      return "Foto rejeitada com sucesso";
    }

    throw new createHttpError.BadGateway("Ação não configurada");
  },
  {
    public: true,
    body: z
      .object({
        action: z.enum(["approve", "reject"]),
        reason: z.string().optional(),
      })
      .superRefine((arg, ctx) => {
        if (arg.action === "reject" && !arg.reason)
          return ctx.addIssue({
            code: "custom",
            path: ["reason"],
            message: "Especifique um motivo",
          });
      }),
  },
);
