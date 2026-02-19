import {
  Payment,
  PaymentStatus,
  PaymentType,
} from "@/generated/prisma/browser";

function getOrderTotalAmount(payments: Payment[]) {
  return payments
    .filter(
      (p) =>
        p.status === PaymentStatus.ACTIVE || p.status === PaymentStatus.PAID,
      // isRefunded(p) === "partially",
    )
    .reduce((v, p) => getPaymentValue(p) + v, 0);
}

// function isRefunded(payment: Payment) {
//   if (payment.status !== "refunded") return null;
//   if (getPaymentValue(payment) === 0) return "completely";
//   else return "partially";
// }

function getPaymentValue(payment: Payment) {
  const paymentValue = Number(payment.amount) || 0;
  const refundValue = Number(payment.refundAmount) || 0;
  return paymentValue - refundValue;
}

function getPaidPayments(payments: Payment[]) {
  return payments.filter(
    (p) => p.status === PaymentStatus.PAID,
    // || isRefunded(p) === "partially",
  );
}

function hasRequiredPayments(payments: Payment[]) {
  const pending = payments.filter((p) => p.status === PaymentStatus.ACTIVE);
  return pending.some(
    (p) =>
      p.type === PaymentType.CARD_CREDIT ||
      p.type === PaymentType.PIX ||
      p.type === PaymentType.PIX_CNPJ,
  );
}

function isPaid(payments: Payment[]) {
  const pending = payments.filter((p) => p.status === PaymentStatus.ACTIVE);
  const hasPaidPayment = payments.some(
    (p) => p.status === PaymentStatus.PAID,
    //  || isRefunded(p) === "partially",
  );
  return pending.length === 0 && hasPaidPayment;
}

// function getOrderPayments(payments: Pagamento[], orderId: string) {
//   return payments.filter((p) => p.PedidoId === orderId);
// }

// function getValidPayments(payments: Pagamento[]) {
//   return payments.filter(
//     (p) =>
//       p.Status === "ativo" ||
//       p.Status === "pago" ||
//       isRefunded(p) === "partially",
//   );
// }

// function isValidPaymentStatus(status: string) {
//   return [""];
// }

export const PaymentUtils = {
  getOrderTotalAmount,
  getPaymentValue,
  getPaidPayments,
  hasRequiredPayments,
  isPaid,
  // isRefunded,
  // getOrderPayments,
  // getValidPayments,
  // isValidPaymentStatus,
};
