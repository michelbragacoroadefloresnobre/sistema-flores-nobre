import axios from "axios";
import { addDays } from "date-fns";
import createHttpError from "http-errors";
import { CNPJ, env } from "../env";
import { CreatePagarmeOrderPayment, PagarmeOrderResponse } from "./types";

async function getApi(cnpjType: CNPJ) {
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
  const response = await (await getApi(cnpjType)).post("/orders", orderData);

  const data = response.data as PagarmeOrderResponse;

  const charges = data?.charges[0];

  if (charges?.last_transaction?.gateway_response?.code === "400") {
    console.error(JSON.stringify(data, null, 2));
    const message =
      charges.last_transaction.gateway_response.errors?.[0].message;
    if (message?.includes("CPF"))
      throw new createHttpError.BadRequest("O CPF cadastrado é invalido");
    else if (message?.includes("CNPJ"))
      throw new createHttpError.BadRequest("O CNPJ cadastrado é invalido");
    throw new createHttpError.BadRequest(
      "Verifique os dados e tente novamente",
    );
  }

  if (
    (charges.payment_method === "pix" || charges.payment_method === "boleto") &&
    data.status !== "pending"
  )
    throw new createHttpError.BadRequest("Pagamento reprovado");
  if (
    charges.payment_method === "credit_card" &&
    (data.status !== "paid" || charges.last_transaction.status !== "captured")
  )
    throw new createHttpError.BadRequest("Pagamento reprovado");

  return data;
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
  paymentMethod: "pix" | "boleto" | "credit_card";
  boletoDue?: Date;
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
        amount: data.value * 100,
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
  } else if (data.paymentMethod === "boleto") {
    basePayload.payments.push({
      payment_method: "boleto",
      boleto: {
        bank: "237",
        due_at: data.boletoDue,
        document_number: data.id.slice(0, 16),
        type: "DM",
        interest: {
          days: 1,
          type: "percentage",
          amount: 1,
        },
        fine: {
          days: 1,
          type: "percentage",
          amount: 1,
        },
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

async function refundPayment(externalId: string, amount: number) {
  const legacyApi = await getApi(CNPJ.FN);

  const results = await Promise.allSettled([
    legacyApi.delete(`/charges/${externalId}`, {
      data: { amount },
    }),
  ]);

  const legacyPayment =
    results[0].status === "fulfilled" ? results[0].value : null;

  const legacyStatus = legacyPayment?.data.last_transaction?.status;

  const checkIfFailed = (status: string) =>
    status !== "refunded" &&
    status !== "pending_refund" &&
    status !== "partial_refunded";

  if (checkIfFailed(legacyStatus)) {
    console.error(JSON.stringify({ legacyPayment }, null, 2));
    throw new createHttpError.BadRequest("Erro ao estornar pagamento");
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
  } else if (paymentMethod === "boleto") {
    paymentData = {
      text: undefined,
      url: lastTransaction.pdf!,
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
