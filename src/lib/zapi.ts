import axios from "axios";
import { env } from "./env";

export interface iChat {
  pinned: string;
  messagesUnread: string;
  unread: string;
  lastMessageTime: string;
  isGroupAnnouncement: boolean;
  archived: string;
  phone: string;
  name?: string;
  isGroup: boolean;
  isMuted: string;
  isMarkedSpam: string;
}

export async function getSupplierGroups(): Promise<iChat[]> {
  const token = env.ZAPI_TOKEN;
  const instance = env.ZAPI_INSTANCE;
  const client_token = env.ZAPI_CLIENT_TOKEN;

  const config = { headers: { "client-token": client_token } };

  const response = await axios.get<iChat[]>(
    `https://api.z-api.io/instances/${instance}/token/${token}/groups?page=1&pageSize=999`,
    config,
  );

  return response.data || [];
}

export const sendMessageToSupplierWithButtons = async (
  numberOrGroupId: string | null,
  message: string,
  buttons: {
    id: string;
    label: string;
  }[],
  image?: string,
) => {
  const token = env.ZAPI_TOKEN;
  const instance = env.ZAPI_INSTANCE;
  const client_token = env.ZAPI_CLIENT_TOKEN;

  if (!token || !instance || !client_token) {
    throw new Error("Z-Api token or instance is not set");
  }

  const config = { headers: { "client-token": client_token } };

  const fetchResponse = await axios.post(
    `https://api.z-api.io/instances/${instance}/token/${token}/send-button-list`,
    {
      phone: numberOrGroupId || env.NEXT_PUBLIC_INTERNAL_SUPPLIER_JID,
      message: message,
      buttonList: {
        image,
        buttons,
      },
    },
    config,
  );

  return fetchResponse.data;
};

export const sendMessageToSupplier = async (
  numberOrGroupId: string | null,
  message: string,
) => {
  const token = env.ZAPI_TOKEN;
  const instance = env.ZAPI_INSTANCE;
  const client_token = env.ZAPI_CLIENT_TOKEN;

  if (!token || !instance || !client_token) {
    throw new Error("Z-Api token or instance is not set");
  }

  const config = { headers: { "client-token": client_token } };

  const fetchResponse = await axios.post(
    `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
    {
      phone: numberOrGroupId || env.NEXT_PUBLIC_INTERNAL_SUPPLIER_JID,
      message: message,
    },
    config,
  );

  return fetchResponse.data;
};

export const buildRequestMessage = (data: {
  orderId: string;
  deliveryLocal: string;
  time: string;
  productName: string;
  size: string;
  supplierNote: string | undefined;
}) => {
  let message = `
📦 NOVO PEDIDO - *#NOBRE${data.orderId}*

📍 Local da Entrega: 
*${data.deliveryLocal.trim()}*

⏰ Horário da Entrega:
*${data.time}*

🌹 Modelo da Coroa de Flores: 
*${data.productName}*

↔️ Tamanho:
*${data.size}*
`;

  if (data.supplierNote)
    message += `
📌 Observações:
*${data.supplierNote}*
`;
  return message;
};

export const buildConfirmationMessage = (data: {
  panelId: string;
  orderId: string;
  honoreeName: string;
  deliveryLocal: string;
  time: string;
  tributeCardPhrase: string;
  productName: string;
  size: string;
  supplierNote: string | undefined;
}) => {
  let message = `
PEDIDO 📦 *#NOBRE${data.orderId}*

🙇🏻‍♂️ Nome da Pessoa Homenageada: 
*${data.honoreeName}*

📍 Local da Entrega: 
*${data.deliveryLocal.trim()}*

⏰ Horário:
*${data.time}*

📩 Frase de Homenagem: 
*${data.tributeCardPhrase}*

🌹 Produto: 
*${data.productName}*

↔️ Tamanho:
*${data.size}*
`;

  if (data.supplierNote)
    message += `
📌 Observações:
*${data.supplierNote}*
`;

  message += `
📳 Painel:
${env.NEXT_PUBLIC_WEBSITE_URL}/painel/${data.panelId}
`;

  return message;
};
