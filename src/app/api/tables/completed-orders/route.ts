import { Prisma } from "@/generated/prisma/client";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { completedFilterOptionsSchema } from "@/modules/orders/dtos/completed-order-table.dto";

import z from "zod";

export const GET = createRoute(
  async (req, { searchParams }) => {
    const where: Prisma.OrderFindManyArgs["where"] = {};

    where.orderStatus = "FINALIZED";

    if (searchParams.createdAtStart || searchParams.createdAtEnd) {
      const startDate = searchParams.createdAtStart
        ? new Date(searchParams.createdAtStart)
        : undefined;
      const endDate = searchParams.createdAtEnd
        ? new Date(searchParams.createdAtEnd)
        : undefined;
      if (!startDate)
        where.createdAt = {
          lte: endDate,
        };
      else if (!endDate)
        where.createdAt = {
          gte: startDate,
        };
      else
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
    }

    if (searchParams.idOrder) {
      where.id = {
        contains: searchParams.idOrder,
        mode: "insensitive",
      };
    }

    if (searchParams.canceledOrders === "true") {
      where.orderStatus = "CANCELLED";
    } else if (searchParams.canceledOrders === "false") {
      where.orderStatus = { not: "CANCELLED" };
    }

    if (searchParams.paidStatus) {
      where.payments = {
        some: {
          status: searchParams.paidStatus,
        },
      };
    }

    if (searchParams.paidAtStart || searchParams.paidAtEnd) {
      const paidStart = searchParams.paidAtStart
        ? new Date(searchParams.paidAtStart)
        : undefined;
      const paidEnd = searchParams.paidAtEnd
        ? new Date(searchParams.paidAtEnd)
        : undefined;

      const paidAtFilter: Prisma.DateTimeNullableFilter = {};
      if (paidStart) paidAtFilter.gte = paidStart;
      if (paidEnd) paidAtFilter.lte = paidEnd;

      where.payments = {
        ...((where.payments as Prisma.PaymentListRelationFilter) || {}),
        some: {
          ...((where.payments as Prisma.PaymentListRelationFilter)?.some || {}),
          paidAt: paidAtFilter,
        },
      };
    }

    if (searchParams.supplierPaymentStatus) {
      where.supplierPaymentStatus = searchParams.supplierPaymentStatus;
    }

    if (searchParams.contact) {
      where.contact = {
        OR: [
          { name: { contains: searchParams.contact, mode: "insensitive" } },
          { email: { contains: searchParams.contact, mode: "insensitive" } },
          { phone: { contains: searchParams.contact, mode: "insensitive" } },
        ],
      };
    }

    if (searchParams.contactType) {
      where.contact = {
        ...((where.contact as Prisma.ContactWhereInput) || {}),
        personType: searchParams.contactType,
      };
    }

    if (searchParams.contactOrigin) {
      where.contactOrigin = searchParams.contactOrigin;
    }

    if (searchParams.taxId) {
      where.contact = {
        ...((where.contact as Prisma.ContactWhereInput) || {}),
        taxId: { contains: searchParams.taxId, mode: "insensitive" },
      };
    }

    if (searchParams.sellers && searchParams.sellers.length > 0) {
      where.userId = { in: searchParams.sellers };
    }

    if (searchParams.suppliers && searchParams.suppliers.length > 0) {
      where.supplierPanels = {
        some: {
          supplierId: { in: searchParams.suppliers },
        },
      };
    }

    if (searchParams.product) {
      where.orderProducts = {
        some: {
          variant: {
            product: {
              name: { contains: searchParams.product, mode: "insensitive" },
            },
          },
        },
      };
    }

    if (searchParams.coverageAreaStart || searchParams.coverageAreaEnd) {
      const cepStart = searchParams.coverageAreaStart
        ? searchParams.coverageAreaStart
        : undefined;
      const cepEnd = searchParams.coverageAreaEnd
        ? searchParams.coverageAreaEnd
        : undefined;

      const zipFilter: Prisma.StringFilter = {};
      if (cepStart) zipFilter.gte = cepStart;
      if (cepEnd) zipFilter.lte = cepEnd;

      where.deliveryZipCode = zipFilter;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        payments: { select: { amount: true, status: true, paidAt: true } },
        supplierPanels: {
          select: {
            cost: true,
            freight: true,
            supplier: { select: { id: true, name: true } },
          },
        },
        orderProducts: {
          select: {
            variant: {
              select: {
                price: true,
                product: { select: { name: true, basePrice: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = orders.map((order) => {
      const payment = order.payments[0];
      const panel = order.supplierPanels[0];

      const cost = panel
        ? Number(panel.cost ?? 0) + Number(panel.freight ?? 0)
        : 0;

      return {
        id: order.id,
        supplierName: panel?.supplier?.name ?? "Sem fornecedor",
        sellerName: order.user.name,
        amount: payment ? Number(payment.amount) : 0,
        cost,
        createdAt: order.createdAt.toISOString(),
        paymentStatus: payment?.status ?? "ACTIVE",
        supplierPaymentStatus: order.supplierPaymentStatus,
      };
    });

    return { data };
  },
  {
    searchParams: completedFilterOptionsSchema,
  },
);

const patchBodySchema = z.object({
  orderIds: z.array(z.string()).min(1),
  supplierPaymentStatus: z.enum(["PAID", "WAITING"]),
});

export const PATCH = createRoute(
  async (req, { body }) =>  {
    const { orderIds, supplierPaymentStatus } = body;

    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { supplierPaymentStatus },
    });

    return { data: { success: true, updated: orderIds.length } };
  },
  {
    body: patchBodySchema,
  },
);