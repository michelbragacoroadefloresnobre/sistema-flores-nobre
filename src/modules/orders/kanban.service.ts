import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { PaymentUtils } from "@/lib/payment-utils";
import prisma from "@/lib/prisma";
import {
  iOrderDelivering,
  iOrderPending,
  iOrderProducing,
} from "@/modules/orders/dtos/kanban.dto";
import { productSizeName } from "../products/product.mapper";

export const getPendingOrders = async (): Promise<iOrderPending[]> => {
  const orders = await prisma.order.findMany({
    where: {
      orderStatus: {
        in: [
          OrderStatus.PENDING_PREPARATION,
          OrderStatus.PENDING_WAITING,
          OrderStatus.PENDING_CANCELLED,
        ],
      },
    },
    orderBy: { deliveryUntil: "asc" },
    include: {
      contact: {
        select: { name: true, phone: true },
      },
      product: { select: { name: true, size: true } },
      user: { select: { id: true, name: true } },
      payments: true,
      supplierPanels: {
        where: { status: SupplierPanelStatus.WAITING },
        include: {
          supplier: { select: { name: true, jid: true } },
        },
      },
    },
  });
  return orders.map(
    (order) =>
      ({
        id: order.id,
        orderStatus: order.orderStatus,
        deliveryPeriod: order.deliveryPeriod,
        deliveryUntil: order.deliveryUntil.toISOString(),
        isWaited: order.isWaited,
        seller: { id: order.user.id, name: order.user.name },
        supplierPanel: order.supplierPanels[0]
          ? {
              id: order.supplierPanels[0].id,
              expireAt: order.supplierPanels[0].expireAt.toISOString(),
              supplierName: order.supplierPanels[0].supplier.name,
              supplierJid: order.supplierPanels[0].supplier.jid,
            }
          : undefined,
        deliveryZipCode: order.deliveryZipCode,
        customerName: order.contact.name,
        customerPhone: order.contact.phone,
        productName: `${order.product.name} (${productSizeName[order.product.size]})`,
        amount: PaymentUtils.getOrderTotalAmount(order.payments),
        isPaid: PaymentUtils.isPaid(order.payments),
        hasRefunded: false,
        internalNote: order.internalNote,
        createdAt: order.createdAt.toISOString(),
      }) satisfies iOrderPending,
  );
};

export const getProducingOrders = async (): Promise<
  (iOrderProducing | { error: string })[]
> => {
  const orders = await prisma.order.findMany({
    where: {
      orderStatus: {
        in: [
          OrderStatus.PRODUCING_PREPARATION,
          OrderStatus.PRODUCING_CONFIRMATION,
        ],
      },
    },
    orderBy: { deliveryUntil: "asc" },
    include: {
      contact: {
        select: { name: true, phone: true },
      },
      product: { select: { name: true, size: true } },
      user: { select: { id: true, name: true } },
      payments: true,
      supplierPanels: {
        where: { status: SupplierPanelStatus.CONFIRMED },
        include: {
          supplier: { select: { name: true } },
        },
      },
    },
  });
  return orders.map((order) => {
    const supplierPanel =
      order.supplierPanels.length > 0 ? order.supplierPanels[0] : undefined;
    if (!supplierPanel)
      return { error: `Pedido #NOBRE${order.id} com erro. Contate o suporte` };
    return {
      id: order.id,
      orderStatus: order.orderStatus,
      deliveryPeriod: order.deliveryPeriod,
      deliveryUntil: order.deliveryUntil.toISOString(),
      seller: { id: order.user.id, name: order.user.name },
      supplierName: supplierPanel.supplier.name,
      supplierPanel: {
        id: supplierPanel.id,
        imageUrl: supplierPanel.imageUrl,
      },
      customerName: order.contact.name,
      customerPhone: order.contact.phone,
      productName: `${order.product.name} (${productSizeName[order.product.size]})`,
      amount: PaymentUtils.getOrderTotalAmount(order.payments),
      isPaid: PaymentUtils.isPaid(order.payments),
      hasRefunded: false,
      internalNote: order.internalNote,
      createdAt: order.createdAt.toISOString(),
    } satisfies iOrderProducing;
  });
};

export const getDeliveringOrders = async (): Promise<
  (iOrderDelivering | { error: string })[]
> => {
  const orders = await prisma.order.findMany({
    where: {
      orderStatus: {
        in: [OrderStatus.DELIVERING_ON_ROUTE, OrderStatus.DELIVERING_DELIVERED],
      },
    },
    orderBy: { deliveryUntil: "asc" },
    include: {
      contact: {
        select: { name: true, phone: true },
      },
      product: { select: { name: true, size: true } },
      user: { select: { id: true, name: true } },
      payments: true,
      supplierPanels: {
        where: { status: SupplierPanelStatus.CONFIRMED },
        include: {
          supplier: { select: { name: true } },
        },
      },
    },
  });
  return orders.map((order) => {
    const supplierPanel =
      order.supplierPanels.length > 0 ? order.supplierPanels[0] : undefined;
    if (!supplierPanel)
      return { error: `Pedido #NOBRE${order.id} com erro. Contate o suporte` };
    return {
      id: order.id,
      orderStatus: order.orderStatus,
      deliveryPeriod: order.deliveryPeriod,
      deliveryUntil: order.deliveryUntil.toISOString(),
      seller: { id: order.user.id, name: order.user.name },
      supplierName: supplierPanel.supplier.name,
      supplierPanel: {
        id: supplierPanel.id,
        imageUrl: supplierPanel.imageUrl,
        cost: (Number(supplierPanel.cost) || 0).toFixed(2) || null,
      },
      customerName: order.contact.name,
      customerPhone: order.contact.phone,
      productName: `${order.product.name} (${productSizeName[order.product.size]})`,
      amount: PaymentUtils.getOrderTotalAmount(order.payments),
      isPaid: PaymentUtils.isPaid(order.payments),
      hasRefunded: false,
      internalNote: order.internalNote,
      createdAt: order.createdAt.toISOString(),
    } satisfies iOrderDelivering;
  });
};
