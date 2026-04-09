import {
  DeliveryPeriod,
  FormStatus,
  FormType,
  LeadStatus,
  LogType,
  OrderStatus,
  Prisma,
  SupplierPaymentStatus,
} from "@/generated/prisma/client";
import { SP_TIMEZONE } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { createCityIfNotExists } from "@/modules/cities/city.service";
import { createOrderSchema } from "@/modules/orders/dtos/create-order.dto";
import { createPayment } from "@/modules/orders/order-creation.service";
import { notifyPayment } from "@/modules/payments/payment.service";
import { subDays } from "date-fns";
import createHttpError from "http-errors";
import { DateTime, Duration } from "luxon";

export const POST = createRoute(
  async (req, { body, auth }) => {
    const [customerCity] = await Promise.all([
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

    const seller = await prisma.user.findUnique({
      where: {
        id: body.sellerId,
        banned: false,
      },
    });

    if (!seller) throw new createHttpError.BadRequest("Vendedor invalido");

    const periodHours: Record<string, number> = {
      [DeliveryPeriod.MORNING]: 6,
      [DeliveryPeriod.AFTERNOON]: 12,
      [DeliveryPeriod.BUSINESSHOURS]: 18,
    };

    let deliveryUntil: DateTime;

    if (body.deliveryPeriod === DeliveryPeriod.EXPRESS)
      deliveryUntil = DateTime.fromISO(body.deliveryUntil!);
    else {
      const hour = periodHours[body.deliveryPeriod];

      if (!hour)
        throw new createHttpError.BadRequest("Periodo informado é invalido");

      deliveryUntil = DateTime.fromISO(body.deliveryDate!, {
        zone: SP_TIMEZONE,
      }).set({ hour, minute: 0, millisecond: 0 });
    }

    const isCustomer = await prisma.form.count({
      where: {
        phone: body.customerPhone,
        status: FormStatus.CONVERTED,
        createdAt: { lt: subDays(new Date(), 1) },
      },
    });

    let contact = await prisma.contact.findUnique({
      where: { phone: body.customerPhone },
    });

    const { payment, order } = await prisma.$transaction(async (tx) => {
      const contactData: Prisma.ContactCreateArgs["data"] = {
        name: body.customerName,
        legalName: body.customerLegalName,
        ie: body.customerIe,
        email: body.customerEmail,
        phone: body.customerPhone,
        personType: body.customerPersonType,
        taxId: body.customerTaxId,
        zipCode: body.customerZipCode.toString(),
        address: body.customerAddress,
        addressNumber: body.customerAddressNumber,
        addressComplement: body.customerAddressComplement,
        neighboorhood: body.customerNeighboorhood,
        ibge: body.customerIbge,
      };

      if (!contact) contact = await tx.contact.create({ data: contactData });
      else
        contact = await tx.contact.update({
          data: contactData,
          where: { id: contact.id },
        });

      let form = await tx.form.findFirst({
        where: {
          phone: body.customerPhone,
          createdAt: { gt: subDays(new Date(), 1) },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      await tx.lead.upsert({
        where: { phone: contact.phone },
        create: {
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          status: LeadStatus.CONVERTED,
        },
        update: {
          name: contact.name,
          email: contact.email,
          status: LeadStatus.CONVERTED,
        },
      });

      if (form) {
        if (form.status !== FormStatus.CONVERTED)
          await tx.form.update({
            where: { id: form.id },
            data: {
              status: FormStatus.CONVERTED,
            },
          });
      } else
        form = await tx.form.create({
          data: {
            status: FormStatus.CONVERTED,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            type: FormType.MANUAL,
            isCustomer: !!isCustomer,
            sellerHelenaId: seller.helenaId,
          },
        });

      const order = await tx.order.create({
        data: {
          orderStatus: OrderStatus.PENDING_PREPARATION,
          contactOrigin: body.contactOrigin,
          deliveryPeriod: body.deliveryPeriod,
          formId: form.id,
          deliveryUntil: deliveryUntil.toJSDate(),
          userId: body.sellerId,
          isWaited: body.isWaited,
          internalNote: body.internalNote,
          honoreeName: body.honoreeName,
          senderName: body.senderName || contact.name,
          tributeCardPhrase: body.tributeCardPhrase,
          supplierNote: body.supplierNote,
          supplierPaymentStatus: SupplierPaymentStatus.WAITING,
          contactId: contact.id,
          deliveryAddress: body.deliveryAddress,
          deliveryZipCode: body.deliveryZipCode,
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
          orderProducts: {
            createMany: {
              data: body.productVariants.flatMap((pv) =>
                Array.from({ length: pv.quantity }).map(() => ({
                  variantId: pv.variantId,
                })),
              ),
            },
          },
        },
        include: {
          orderProducts: {
            include: { variant: { include: { product: true } } },
          },
        },
      });

      const { payment } = await createPayment({
        tx,
        body: {
          amount: body.productVariants
            .reduce(
              (amount, item) => item.unitPrice * item.quantity + amount,
              0,
            )
            .toFixed(2),
          type: body.paymentType,
          orderId: order.id,
          status: body.paymentStatus,
          productName: `Pedido #NOBRE${order.id}`,
        },
        customer: contact,
        city: customerCity,
      });

      return { payment, order };
    });

    try {
      await notifyPayment({
        payment,
        order,
        customer: contact!,
      });
    } catch (e) {
      console.error("Erro ao enviar mensagem para o cliente:", e);

      return "Pedido criado com sucesso, mas houve um erro ao enviar a mensagem para o cliente.";
    }

    return "Pedido criado com sucesso!";
  },
  {
    body: createOrderSchema,
  },
);
