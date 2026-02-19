import prisma from "@/lib/prisma";
import { isValidUUID } from "@/lib/utils";
import { subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export type SessionUpdateEvent = {
  eventType: "SESSION_UPDATE";
  date: string; // ISO date
  content: SessionContent;
  changeMetadata: ChangeMetadata;
};

export type SessionContent = {
  id: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  number: string;
  startAt: string;
  endAt: string | null;
  firstUserInteractionAt: string | null;
  firstAgentMessageAt: string | null;
  status: "IN_PROGRESS" | "FINISHED" | "WAITING" | string;
  contactId: string;
  contactDetails: ContactDetails;
  channelId: string;
  channelType: "CLOUDAPI_WHATSAPP" | string;
  channelDetails: ChannelDetails;
  companyId: string;
  departmentId: string;
  departmentDetails: DepartmentDetails;
  userId?: string;
  botId: string;
  botVersionId: string;
  agentDetails: AgentDetails;
  previousSessionId: string | null;
  readTimestamp: string | null;
  waitReply: boolean;
  expired: boolean;
  windowStatus: "ACTIVE" | "EXPIRED" | string;
  lastInteractionDate: string | null;
  lastMessageOut: string | null;
  lastMessageIn: string | null;
  lastMessageText: string | null;
  unreadCount: number;
  previewUrl: string;
  utm: unknown | null;
  classification: unknown | null;
  metadata: unknown | null;
};

export type ContactDetails = {
  id: string;
  name: string;
  email: string;
  pictureUrl: string | null;
  phonenumber: string;
  instagram: string | null;
  phonenumberFormatted: string;
  tagsId: string[];
  status: "ACTIVE" | "INACTIVE" | string;
  tagsName: string[];
};

export type ChannelDetails = {
  id: string;
  platform: "WhatsApp" | string;
  provider: "Meta" | string;
  providerVariable: string | null;
  pictureUrl: string | null;
  displayName: string | null;
};

export type DepartmentDetails = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
};

export type AgentDetails = {
  id: string;
  userId: string;
  name: string;
  shortName: string;
  phoneNumber: string;
  email: string;
  pictureFileId: string | null;
  pictureUrl: string | null;
};

export type ChangeMetadata = {
  source: "USER" | "SYSTEM" | string;
  userId: string;
  changes: Change[];
};

export type Change = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
};

export async function POST(req: NextRequest) {
  const data: SessionUpdateEvent = await req.json();

  console.log(JSON.stringify(data, null, 2));

  if (data.eventType === "SESSION_UPDATE" && isValidUUID(data.content.userId)) {
    try {
      const { count } = await prisma.form.updateMany({
        data: {
          sellerHelenaId: data.content.userId,
        },
        where: {
          phone: data.content.contactDetails.phonenumber.replace(/\D/g, ""),
          sellerHelenaId: null,
          createdAt: { gte: subDays(new Date(), 1) },
        },
      });

      if (!count) {
        console.info("Formulario não encontrado");
        return new NextResponse(null);
      }
    } catch (e: any) {
      console.error(`[${e.name}]`, e);
    }
  }
  return new NextResponse(null, { status: 204 });
}
