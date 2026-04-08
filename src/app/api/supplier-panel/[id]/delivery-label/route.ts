import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { deliveryPeriodMap } from "@/lib/utils";
import { DeliveryPeriod } from "@/generated/prisma/enums";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import createHttpError from "http-errors";
import { buildDeliveryLabelPdf } from "./build-pdf";

export const GET = createRoute(
  async (req, { params }) => {
    const { id } = params;

    const panel = await prisma.supplierPanel.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            city: true,
            contact: { select: { phone: true } },
          },
        },
      },
    });

    if (!panel) throw createHttpError.NotFound("Painel não encontrado");

    const order = panel.order;

    const periodLabel = deliveryPeriodMap[order.deliveryPeriod];
    const deliveryDate =
      order.deliveryPeriod === DeliveryPeriod.EXPRESS
        ? `${formatInTimeZone(order.deliveryUntil, "America/Sao_Paulo", "dd/MM/yy HH:mm")}`
        : format(order.deliveryUntil, "dd/MM/yy");

    const pdfBuffer = await buildDeliveryLabelPdf({
      orderId: order.id,
      honoreeName: order.honoreeName,
      senderName: order.senderName,
      deliveryAddress: order.deliveryAddress,
      deliveryAddressNumber: order.deliveryAddressNumber,
      deliveryAddressComplement: order.deliveryAddressComplement,
      deliveryNeighboorhood: order.deliveryNeighboorhood,
      deliveryZipCode: order.deliveryZipCode,
      cityName: order.city?.name ?? null,
      cityUf: order.city?.uf ?? null,
      deliveryDate,
      deliveryPeriod: periodLabel,
      contactPhone: order.contact.phone,
      supplierNote: order.supplierNote,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="etiqueta-entrega.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  },
  { public: true },
);
