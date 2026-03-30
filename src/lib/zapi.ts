import axios from "axios";
import { env } from "./env";
import sharp from "sharp";
import createHttpError from "http-errors";

function formatQuotedBold(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() ? `> *${line}*` : `>`))
    .join("\n");
}

function formatQuoted(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() ? `> ${line}` : `>`))
    .join("\n");
}

function formatBold(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() ? `*${line}*` : ""))
    .join("\n");
}

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

async function mergeImages(urls: string[]): Promise<string> {
  const images = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      return sharp(buffer).resize(300, 300, { fit: "cover" }).toBuffer();
    }),
  );

  const cols = Math.ceil(Math.sqrt(images.length));
  const rows = Math.ceil(images.length / cols);
  const size = 300;
  const gap = 5;

  const composites = images.map((img, i) => ({
    input: img,
    left: (i % cols) * (size + gap),
    top: Math.floor(i / cols) * (size + gap),
  }));

  const buffer = await sharp({
    create: {
      width: cols * (size + gap) - gap,
      height: rows * (size + gap) - gap,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return `data:image/png;base64,${buffer.toString("base64")}`;
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
  urlPhotos?: string[],
) => {
  const token = env.ZAPI_TOKEN;
  const instance = env.ZAPI_INSTANCE;
  const client_token = env.ZAPI_CLIENT_TOKEN;

  if (!token || !instance || !client_token) {
    throw new Error("Z-Api token or instance is not set");
  }

  const config = { headers: { "client-token": client_token } };

  if(!urlPhotos) throw new createHttpError.BadRequest("Nenhuma foto encontrada para os produtos");

  const mergedImages = urlPhotos.length > 0 ? await mergeImages(urlPhotos) : urlPhotos[0];

  const fetchResponse = await axios.post(
    `https://api.z-api.io/instances/${instance}/token/${token}/send-button-list`,
    {
      phone: numberOrGroupId || env.NEXT_PUBLIC_INTERNAL_SUPPLIER_JID,
      message: message,
      buttonList: { image: mergedImages, buttons },
    },
    config,
  );

  return ""; //fetchResponse.data;
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

export const sendPhotoToSupplier = async (
  numberOrGroupId: string | null,
  message: string,
  imageUrl: string,
  firstMessageId: string,
) => {
  const token = env.ZAPI_TOKEN;
  const instance = env.ZAPI_INSTANCE;
  const client_token = env.ZAPI_CLIENT_TOKEN;

  if (!token || !instance || !client_token) {
    throw new Error("Z-Api token or instance is not set");
  }

  const config = { headers: { "client-token": client_token } };

  const fetchResponse = await axios.post(
    `https://api.z-api.io/instances/${instance}/token/${token}/send-image`,
    {
      phone: numberOrGroupId || env.NEXT_PUBLIC_INTERNAL_SUPPLIER_JID,
      image: imageUrl,
      caption: message,
      messageId: firstMessageId,
    },
    config,
  );

  return fetchResponse.data;
};

export const buildRequestMessage = (data: {
  orderId: string;
  deliveryLocal: string;
  time: string;
  supplierNote: string | undefined;
}) => {
  let message = `
📦 NOVO PEDIDO - *#NOBRE${data.orderId}*

📍 Local da Entrega:
${data.deliveryLocal}

⏰ Horário da Entrega:
*${data.time}*
`;

  if (data.supplierNote)
    message += `
📌 Observações:
${formatBold(data.supplierNote)}
`;
  return message;
};

export const buildConfirmationMessage = (data: {
  panelId: string;
  orderId: string;
  senderName: string;
  honoreeName: string;
  tributeCardPhrase: string;
  deliveryLocal: string;
  time: string;
  supplierNote: string | undefined;
  productList: {name: string, quantity: number}[];
}) => {
  let message = `
PEDIDO 📦 *#NOBRE${data.orderId}*

🙇🏻‍♂️ Nome da Pessoa Homenageada:
${formatQuotedBold(data.honoreeName)}

📍 Local da Entrega:
${data.deliveryLocal}

⏰ Horário:
${formatQuotedBold(data.time)}

🌹 Produtos:
`;

data.productList.forEach(p => {
  message += `
> *${p.name}*
> Quantidade: *${p.quantity}*
`;
});

  if (data.supplierNote)
    message += `
📌 Observações:
${formatQuotedBold(data.supplierNote)}
`;

  if (data.honoreeName)
    message += `
🎁 Nome do Remetente:
${formatQuotedBold(data.senderName)}

🙇🏻‍♂️ Nome da Pessoa Homenageada:
${formatQuotedBold(data.honoreeName)}

✉️ Frase de Homenagem:
${formatQuotedBold(data.tributeCardPhrase)}
`;

  message += `
📳 Painel:
${env.NEXT_PUBLIC_WEBSITE_URL}/painel/${data.panelId}
`;

  return message;
};

export const buildItemMessage = (data: { itemName: string }) => {
  const message = `
  🌹 Modelo: 
  *${data.itemName}*
  `;
  return message;
};
