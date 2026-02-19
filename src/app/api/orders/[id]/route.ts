import { Prisma } from "@/generated/prisma/client";
import {
  DeliveryPeriod,
  FormStatus,
  LogType,
  OrderStatus,
} from "@/generated/prisma/enums";
import { SP_TIMEZONE } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { createCityIfNotExists } from "@/modules/cities/city.service";
import { editOrderSchema } from "@/modules/orders/dtos/edit-order.dto";
import { finishOrder } from "@/modules/orders/order.service";
import createHttpError, { isHttpError } from "http-errors";
import { DateTime } from "luxon";
import z from "zod";

export const PUT = createRoute(
  async (req, { params, body, auth }) => {
    const { id } = params;

    await Promise.all([
      createCityIfNotExists({
        ibge: body.customerIbge,
        name: body.customerCity,
        uf: body.customerUf,
      }),
      createCityIfNotExists({
        ibge: body.deliveryIbge,
        name: body.deliveryCity,
        uf: body.deliveryUf,
      }),
    ]);

    const periodHours: Record<string, number> = {
      [DeliveryPeriod.MORNING]: 6,
      [DeliveryPeriod.AFTERNOON]: 12,
      [DeliveryPeriod.EVENING]: 18,
    };

    let deliveryUntil: DateTime;

    if (body.deliveryPeriod === DeliveryPeriod.EXPRESS)
      deliveryUntil = DateTime.fromJSDate(new Date(body.deliveryUntil!));
    else {
      const hour = periodHours[body.deliveryPeriod];

      if (!hour)
        throw new createHttpError.BadRequest("Periodo informado é invalido");

      deliveryUntil = DateTime.fromISO(body.deliveryDate!, {
        zone: SP_TIMEZONE,
      }).set({ hour, minute: 0, millisecond: 0 });
    }

    const { order } = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          deliveryPeriod: body.deliveryPeriod,
          contactOrigin: body.contactOrigin,
          deliveryUntil: deliveryUntil.toJSDate(),
          userId: body.sellerId,
          internalNote: body.internalNote,
          honoreeName: body.honoreeName,
          tributeCardPhrase: body.tributeCardPhrase,
          tributeCardType: body.tributeCardType,
          productId: body.productId,
          supplierNote: body.supplierNote,
          deliveryAddress: body.deliveryAddress,
          deliveryZipCode: Number(body.deliveryZipCode),
          deliveryNeighboorhood: body.deliveryNeighboorhood,
          deliveryAddressComplement: body.deliveryAddressComplement,
          deliveryAddressNumber: body.deliveryAddressNumber,
          ibge: body.deliveryIbge,
          auditLogs: {
            create: {
              author: auth?.user.name || "Usuario Desconhecido",
              action: "Formalizou pedido",
              type: LogType.CREATION,
              description: "Pedido formalizado pelo vendedor",
            },
          },
        },
      });

      const contactData: Prisma.ContactCreateArgs["data"] = {
        name: body.customerName,
        legalName: body.customerLegalName,
        ie: body.customerIe,
        email: body.customerEmail,
        phone: body.customerPhone,
        personType: body.customerPersonType,
        taxId: body.customerTaxId,
        zipCode: Number(body.customerZipCode),
        address: body.customerAddress,
        addressNumber: body.customerAddressNumber,
        addressComplement: body.customerAddressComplement,
        neighboorhood: body.customerNeighboorhood,
        ibge: body.customerIbge,
      };

      let contact = await tx.contact.findFirst({
        where: { phone: body.customerPhone },
        orderBy: { createdAt: "desc" },
      });

      if (!contact)
        contact = await tx.contact.update({
          data: contactData,
          where: { id: order.contactId },
        });
      else {
        contact = await tx.contact.update({
          data: contactData,
          where: { id: contact.id },
        });
        await tx.order.update({
          data: { contactId: contact.id },
          where: { id: order.id },
        });
      }

      return { order };
    });

    try {
      if (order.orderStatus === OrderStatus.DELIVERING_DELIVERED)
        await finishOrder(order.id);
    } catch (e: any) {
      if (isHttpError(e)) console.warn(e.message);
      else console.error("Erro ao finalizar pedido:", e);
      return "Pedido atualizado, mas não foi possivel finaliza-lo";
    }

    return "Pedido atualizado com sucesso!";
  },
  {
    body: editOrderSchema,
  },
);

export const DELETE = createRoute(
  async (req, { searchParams, params }) => {
    const order = await prisma.order.update({
      data: {
        orderStatus: OrderStatus.CANCELLED,
      },
      where: { id: params.id },
    });

    const orderCount = await prisma.order.count({
      where: {
        formId: order.formId,
      },
    });

    if (orderCount === 1)
      await prisma.form.update({
        data: {
          cancelReason: searchParams.cancelReason,
          status: FormStatus.CANCELLED,
        },
        where: {
          id: order.formId,
        },
      });

    return "Pedido cancelado com sucesso";
  },
  {
    searchParams: z.object({
      cancelReason: z.string().min(1),
    }),
  },
);
