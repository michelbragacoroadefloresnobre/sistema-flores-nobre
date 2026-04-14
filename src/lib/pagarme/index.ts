import axios from "axios";
import { addDays } from "date-fns";
import createHttpError, { isHttpError } from "http-errors";
import { CNPJ, env } from "../env";
import { CreatePagarmeOrderPayment, PagarmeOrderResponse } from "./types";

function getApi(cnpjType: CNPJ) {
  let credentials;
  switch (cnpjType) {
    case CNPJ.FN:
      credentials = Buffer.from(`${env.PAGARME_SECRET_KEY}:`).toString(
        "base64",
      );
      break;
    default:
      credentials = "";
  }
  return axios.create({
    baseURL: "https://api.pagar.me/core/v5",
    headers: {
      Authorization: "Basic " + credentials,
    },
  });
}

async function createOrder(
  cnpjType: CNPJ,
  orderData: CreatePagarmeOrderPayment,
) {
  try {
    const response = await getApi(cnpjType).post("/orders", orderData);

    const data = response.data as PagarmeOrderResponse;

    const charges = data?.charges[0];
    const lastTransaction = charges?.last_transaction;
    const gatewayError = lastTransaction.gateway_response.errors?.[0]?.message;

    if (lastTransaction?.gateway_response?.code === "400") {
      if (gatewayError?.includes("CPF"))
        throw new createHttpError.BadRequest("O CPF cadastrado é invalido");
      else if (gatewayError?.includes("CNPJ"))
        throw new createHttpError.BadRequest("O CNPJ cadastrado é invalido");
      console.error(`[Pagarme] Gateway 400 | code: ${orderData.code} | erro: ${gatewayError}`);
      throw new createHttpError.BadRequest(
        "Verifique os dados e tente novamente",
      );
    }

    if (!lastTransaction.success) {
      console.error(`[Pagarme] Pagamento reprovado | code: ${orderData.code} | status: ${lastTransaction.status} | gateway: ${JSON.stringify(lastTransaction.gateway_response)}`);
      throw new createHttpError.BadRequest("Pagamento reprovado");
    }

    return data;
  } catch (error: any) {
    if (isHttpError(error)) throw error;

    if (error.response) {
      console.error(`[Pagarme] Erro HTTP ${error.response.status} | code: ${orderData.code} | body:`, JSON.stringify(error.response.data, null, 2));
    }

    throw error;
  }
}

function buildOrderPayload(data: {
  id: string;
  orderId: string;
  customer: {
    phone: string;
    name: string;
    email: string;
    cpfCnpj: string;
    personType: string;
    state: string;
    city: string;
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
  };
  value: number;
  product: string;
  paymentMethod: "pix" | "credit_card";
  card?: {
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
    installments: number;
  };
}): CreatePagarmeOrderPayment {
  const address = {
    country: "BR",
    state: data.customer.state,
    city: data.customer.city,
    zip_code: data.customer.cep,
    line_1: `${data.customer.street}, ${data.customer.number}, ${data.customer.neighborhood}`,
  };

  const basePayload = {
    customer: {
      address,
      phones: {
        mobile_phone: {
          country_code: "55",
          area_code: data.customer.phone.substring(2, 4) || "",
          number: data.customer.phone.substring(4) || "",
        },
      },
      name: data.customer.name,
      email: data.customer.email,
      document: data.customer.cpfCnpj,
      type: data.customer.personType === "cnpj" ? "company" : "individual",
      document_type: data.customer.personType === "cnpj" ? "CNPJ" : "CPF",
    },
    items: [
      {
        amount: Math.round(data.value * 100),
        description: data.product,
        quantity: 1,
        code: data.orderId,
      },
    ],
    code: data.id,
    payments: [] as any,
  };

  if (data.paymentMethod === "pix") {
    basePayload.payments.push({
      payment_method: "pix",
      pix: {
        expires_at: addDays(new Date(), 1).toISOString(),
      },
    });
  } else if (data.paymentMethod === "credit_card" && data.card) {
    const [month, year] = data.card.expiryDate.split("/");
    basePayload.payments.push({
      payment_method: "credit_card",
      credit_card: {
        installments: data.card.installments,
        operation_type: "auth_and_capture",
        statement_descriptor: "Floricultura",
        card: {
          number: data.card.cardNumber,
          holder_name: data.card.cardName,
          exp_month: month,
          exp_year: year,
          cvv: data.card.cvv,
          billing_address: address,
        },
      },
    });
  }

  return basePayload;
}

async function refundPayment(externalId: string, amountInCents: number) {
  const api = getApi(CNPJ.FN);

  let response;
  try {
    response = await api?.delete(`/charges/${externalId}`, {
      data: { amount: amountInCents },
    });
  } catch (error: any) {
    const errorData = error.response?.data;
    throw new createHttpError.BadGateway(
      errorData?.message || "Erro ao comunicar com o gateway de pagamento",
    );
  }

  const status = response.data?.last_transaction?.status;
  const VALID_STATUSES = ["refunded", "pending_refund", "partial_refunded"];

  if (!VALID_STATUSES.includes(status)) {
    console.error(`[Pagarme] Status inesperado no estorno | chargeId: ${externalId} | status: ${status}`);
    throw new createHttpError.BadGateway(
      "O gateway retornou um status inesperado para o estorno",
    );
  }

  return true;
}

function extractPaymentData(orderData: PagarmeOrderResponse): {
  id: string;
  text: string | undefined;
  url: string;
} {
  const charge = orderData.charges[0];
  const lastTransaction = charge.last_transaction;
  const paymentMethod = charge.payment_method;

  let paymentData: {
    text: string | undefined;
    url: string;
  } = {
    text: "",
    url: "",
  };

  if (paymentMethod === "pix") {
    paymentData = {
      text: lastTransaction.qr_code!,
      url: lastTransaction.qr_code_url!,
    };
  }

  return { id: charge.id, ...paymentData };
}

export const Pagarme = {
  createOrder,
  refundPayment,
  buildOrderPayload,
  extractPaymentData,
};
