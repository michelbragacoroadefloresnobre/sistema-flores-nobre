export type ListMessagesResponse = {
  items: {
    id: string;
    createdAt: string;
    updatedAt: string;
    timestamp: string;
    type:
      | "TEXT"
      | "IMAGE"
      | "VIDEO"
      | "AUDIO"
      | "DOCUMENT"
      | "LOCATION"
      | "CONTACT";
    senderId: string | null;
    sessionId: string;
    templateId: string | null;
    userId: string | null;
    direction: "TO_HUB" | "FROM_HUB";
    status: "DELIVERED" | "READ" | "SENT" | "FAILED" | "DELETED";
    origin: "API" | "DEFAULT" | "GATEWAY";
    text: string | null;
    fileId: string | null;
    refId: string | null;
    readContactAt: string | null;
    details: {
      file: {
        id: string;
        companyId: string;
        userId: string | null;
        name: string;
        extension: string;
        mimeType: string;
        type: string;
        publicUrl: string;
        publicUrlDownload: string;
        size: number;
        isThumbnail: boolean;
        thumbnail?: {
          id: string;
          publicUrl: string;
        };
      } | null;
      files: any[];
      fileAsLink: any;
      location: any;
      contact: any;
      errors: any;
      footerText: string | null;
      utm: any;
      payTransactionId: any;
      reactionToContact: any;
      reactionFromContact: any;
      track: any;
      transcription: string | null;
      templateCategoryId: string | null;
      templateCategoryName: string | null;
    };
    failedReason: string | null;
    filesIds: string[] | null;
  }[];
  totalItems: number;
  totalPages: number;
  hasMorePages: boolean;
  pageNumber: number;
  pageSize: number;
  orderBy: string;
  orderDirection: "ASCENDING" | "DESCENDING";
};

export type ListConversationsResponse = {
  items: {
    id: string;
    createdAt: string;
    updatedAt: string;
    startAt: string;
    endAt: string;
    status: "COMPLETED" | "PENDING" | "IN_PROGRESS";
    companyId: string;
    contactId: string;
    channelId: string;
    departmentId: string;
    userId: string;
    previewUrl: string;
    title: string | null;
    number: string;
    utm: null;
    origin: "Empresa" | "Contato";
    contactDetails: null;
    agentDetails: null;
    channelDetails: null;
    departmentDetails: null;
    classification: null;
    statusDescription: string;
    timeService: string;
    timeWait: string;
    firstResponseAt: string;
    botId: string;
    unreadCount: number;
    lastMessageText: string;
    lastInteractionDate: string;
    windowStatus: "ACTIVE" | "INACTIVE";
    metadata: null;
    channelType: null;
  }[];
  totalItems: number;
  totalPages: number;
  hasMorePages: boolean;
  pageNumber: number;
  pageSize: number;
  orderBy: string;
  orderDirection: "ASCENDING" | "DESCENDING";
};
