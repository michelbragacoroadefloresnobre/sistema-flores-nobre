import { DeliveryPeriod, OrderStatus } from "@/generated/prisma/browser";

export interface iOrderPending {
  id: string;
  deliveryPeriod: DeliveryPeriod;
  deliveryUntil: string;
  deliveryZipCode: number;
  supplierPanel:
    | {
        id: string;
        expireAt: string;
        supplierName: string;
        supplierJid: string | null;
      }
    | undefined;
  isWaited: boolean;
  seller: { id: string; name: string };
  orderStatus: OrderStatus;
  customerName: string;
  customerPhone: string;
  productName: string;
  amount: number;
  isPaid: boolean;
  hasRefunded: boolean;
  internalNote: string | null;
  createdAt: string;
}

export interface iOrderProducing {
  id: string;
  deliveryPeriod: DeliveryPeriod;
  deliveryUntil: string;
  supplierPanel: { id: string; imageUrl?: string | null };
  seller: { id: string; name: string };
  supplierName: string;
  orderStatus: OrderStatus;
  customerName: string;
  customerPhone: string;
  productName: string;
  amount: number;
  isPaid: boolean;
  hasRefunded: boolean;
  internalNote: string | null;
  createdAt: string;
}

export interface iOrderDelivering {
  id: string;
  deliveryPeriod: DeliveryPeriod;
  deliveryUntil: string;
  supplierPanel: { id: string; imageUrl?: string | null; cost: string | null };
  seller: { id: string; name: string };
  supplierName: string;
  orderStatus: OrderStatus;
  customerName: string;
  customerPhone: string;
  productName: string;
  amount: number;
  isPaid: boolean;
  hasRefunded: boolean;
  internalNote: string | null;
  createdAt: string;
}

export interface iKanbanOrders {
  pending: iOrderPending[];
  producing: (iOrderProducing | { error: string })[];
  delivering: (iOrderDelivering | { error: string })[];
}
