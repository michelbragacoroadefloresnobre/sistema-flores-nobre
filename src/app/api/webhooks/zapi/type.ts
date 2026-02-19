/**
 * Interface para o callback de resposta de botão do WhatsApp via Z-API
 */
export interface WhatsAppButtonCallback {
  /** Indica se é uma resposta a um status */
  isStatusReply: boolean;

  /** ID do chat no formato Lid */
  chatLid: string;

  /** Número do telefone conectado à instância */
  connectedPhone: string;

  /** Indica se há mensagem em espera */
  waitingMessage: boolean;

  /** Indica se a mensagem foi editada */
  isEdit: boolean;

  /** Indica se é um grupo */
  isGroup: boolean;

  /** Indica se é um newsletter/canal */
  isNewsletter: boolean;

  /** ID da instância Z-API */
  instanceId: string;

  /** ID único da mensagem */
  messageId: string;

  /** Número de telefone do remetente */
  phone: string;

  /** Indica se a mensagem foi enviada por você */
  fromMe: boolean;

  /** Timestamp da mensagem em millisegundos */
  momment: number;

  /** Status da mensagem */
  status: "RECEIVED" | "SENT" | "READ" | "DELIVERED";

  /** Nome do chat */
  chatName: string;

  /** URL da foto do remetente */
  senderPhoto: string | null;

  /** Nome do remetente */
  senderName: string;

  /** URL da foto de perfil */
  photo: string;

  /** Indica se é uma transmissão/broadcast */
  broadcast: boolean;

  /** ID do participante (em grupos) */
  participantLid: string | null;

  /** ID da mensagem de referência */
  referenceMessageId: string;

  /** Tempo de expiração da mensagem em segundos */
  messageExpirationSeconds: number;

  /** Indica se a mensagem foi encaminhada */
  forwarded: boolean;

  /** Tipo de callback recebido */
  type: "ReceivedCallback";

  /** Indica se veio da API */
  fromApi: boolean;

  /** Dados da resposta do botão */
  buttonReply: ButtonReplyData;
}

/**
 * Interface para os dados específicos da resposta do botão
 */
export interface ButtonReplyData {
  /** ID único do botão clicado */
  buttonId: string;

  /** Texto/label do botão que foi clicado */
  message: string;

  /** ID da mensagem original que continha os botões */
  referenceMessageId: string;
}

export type NewWhatsAppButtonCallback = {
  isStatusReply: boolean;
  chatLid: string | null;
  connectedPhone: string;
  waitingMessage: boolean;
  isEdit: boolean;
  isGroup: boolean;
  isNewsletter: boolean;
  instanceId: string;
  messageId: string;
  phone: string;
  fromMe: boolean;
  momment: number;
  status: string;
  chatName: string;
  senderPhoto: string;
  senderName: string;
  photo: string;
  broadcast: boolean;
  participantPhone: string;
  participantLid: string;
  referenceMessageId: string;
  messageExpirationSeconds: number;
  forwarded: boolean;
  type: string;
  fromApi: boolean;
  buttonsResponseMessage: {
    buttonId: string;
    message: string;
  };
  disableAutoSelect?: boolean;
};
