import axios from "axios";
import createHttpError from "http-errors";
import { ListConversationsResponse, ListMessagesResponse } from "./types";

const chatApi = axios.create({
  baseURL: "https://api.helena.run/chat/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + process.env.HELENA_TOKEN,
  },
});

chatApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!original) return Promise.reject(error);

    if (!original._retryCount) original._retryCount = 0;

    if (error.response?.status === 429) {
      const attempt = original._retryCount;

      if (attempt >= 5) {
        return Promise.reject(
          new createHttpError.BandwidthLimitExceeded(
            "Rate limit excedido após múltiplas tentativas",
          ),
        );
      }

      const delayMs = 1000 * (attempt + 1);

      console.warn(
        `[Helena API] 429 recebido. Tentativa ${attempt + 1} após ${delayMs}ms`,
      );

      await new Promise((r) => setTimeout(r, delayMs));

      original._retryCount++;

      return chatApi(original);
    }

    return Promise.reject(error);
  },
);

const coreApi = axios.create({
  baseURL: "https://api.helena.run/core/v1",
  headers: {
    Authorization: "Bearer " + process.env.HELENA_TOKEN,
  },
});

export async function getSessionById(id: string) {
  const fetchResponse = await chatApi.get(`/session/${id}`);
  return fetchResponse.data;
}

export async function sendMessageSync(
  number: string,
  message: string | null | undefined,
  fileUrl?: string,
) {
  const fetchResponse = await chatApi.post("/message/send-sync", {
    from: "558000020001",
    to: number,
    body: {
      text: message,
      fileUrl,
    },
    options: { hiddenSession: true },
  });

  return fetchResponse.data;
}

export async function cancelMessage(id: string) {
  const fetchResponse = await chatApi.delete(`/message/${id}`);
  return fetchResponse.data;
}

export async function getMessageById(id: string) {
  const fetchResponse = await chatApi.get(`/message/${id}`);
  return fetchResponse.data;
}

export async function listMessages(sessionId: string) {
  const fetchResponse = await chatApi.get<ListMessagesResponse>(`/message`, {
    params: { SessionId: sessionId },
  });
  return fetchResponse.data;
}

export async function sendTemplateSync(
  number: string,
  templateId: string | null | undefined,
  userId?: string,
  departmentId?: string,
  forceStartSession?: boolean,
) {
  const body: any = {
    from: "558000020001",
    to: number,
    body: {
      templateId,
    },
    options: {
      hiddenSession: true,
    },
  };

  if (userId) body.user.id = userId;
  if (departmentId) body.department.id = departmentId;
  if (forceStartSession) body.options.forceStartSession = forceStartSession;

  const fetchResponse = await chatApi.post("/message/send-sync", body);

  return fetchResponse.data;
}

export async function sendTemplate(data: {
  number: string;
  templateId: string;
  parameters?: Record<string, string | number | boolean>;
  userId?: string;
  departmentId?: string;
  forceStartSession?: boolean;
}) {
  const body: any = {
    from: "558000020001",
    to: data.number,
    body: {
      templateId: data.templateId,
      parameters: data.parameters,
    },
    options: {
      hiddenSession: true,
    },
  };

  if (data.userId) body.user.id = data.userId;
  if (data.departmentId) body.department.id = data.departmentId;
  if (data.forceStartSession)
    body.options.forceStartSession = data.forceStartSession;

  const fetchResponse = await chatApi.post("/message/send", body);

  console.log(
    `SendTemplate ${data.number}:`,
    JSON.stringify(fetchResponse.data),
  );
  return fetchResponse.data;
}

export async function sendMessage(
  number: string,
  message: string | null | undefined,
  fileUrl?: string,
) {
  const fetchResponse = await chatApi.post("/message/send", {
    from: "558000020001",
    to: number,
    body: {
      text: message,
      fileUrl,
    },
    options: {
      hiddenSession: true,
    },
  });

  console.log("SendMessage number:", JSON.stringify(fetchResponse.data), {
    fileUrl,
  });

  return fetchResponse.data;
}

export async function getContactByPhoneNumber(number: string) {
  const fetchResponse = await coreApi.get(`/contact/phonenumber/${number}`);
  return fetchResponse.data;
}

export async function listSessions(props: {
  contactId?: string;
  createdAfter?: string;
}) {
  const fetchResponse = await chatApi.get<ListConversationsResponse>(
    `/session`,
    {
      params: {
        ContactId: props.contactId,
        "CreatedAt.After": props.createdAfter,
      },
    },
  );
  return fetchResponse.data;
}

export const buildLinkPaymentMessage = (data: {
  payment?: string | null;
  orderId: string;
  honoreeName: string;
  deliveryLocal: string;
  deliveryHour: string;
  tributeCard: string;
  product: string;
  size: string;
}) => {
  let message = `
PEDIDO 📦 #NOBRE${data.orderId}

🙇🏻‍♂️ Nome da Pessoa Homenageada: 
*${data.honoreeName}*

📍 Local da Entrega: 
*${data.deliveryLocal}*

⏰ Horário da Entrega:
*${data.deliveryHour}*

📩 Cartão de Homenagem: 
*${data.tributeCard}*

🌹 Produto: 
*${data.product}*

↔️ Tamanho:
*${data.size}*
`;
  if (data.payment) {
    message += `
🔗 Pagamento:
${data.payment}
`;
  }

  return message;
};
