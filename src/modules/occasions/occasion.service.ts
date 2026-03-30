import { InviteStatus, OccasionType } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { sendMessage, sendOccasionConsentTemplate } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { buildPanelInviteMessage } from "./message.templates";

export async function createCustomerPanelAndNotify(phone: string) {
  const panel = await prisma.customerPanel.upsert({
    where: { phone },
    create: { phone },
    update: {},
  });

  if (panel.inviteStatus !== InviteStatus.PENDING) return;

  const response = await sendOccasionConsentTemplate(phone);

  await prisma.customerPanel.update({
    where: { id: panel.id },
    data: {
      inviteStatus: InviteStatus.SENT,
      consentMessageId: response.id,
    },
  });
}

export async function handleOccasionConsentResponse(
  panelId: string,
  accepted: boolean,
) {
  const panel = await prisma.customerPanel.update({
    where: { id: panelId },
    data: {
      inviteStatus: accepted
        ? InviteStatus.ACCEPTED
        : InviteStatus.DECLINED,
    },
  });

  if (accepted) {
    const panelUrl = `${env.NEXT_PUBLIC_WEBSITE_URL}/ocasioes/${panel.id}`;
    const message = buildPanelInviteMessage(panelUrl);
    const imageUrl = `${env.NEXT_PUBLIC_WEBSITE_URL}/promotional_images/promotional_code.png`;
    await sendMessage(panel.phone, message, imageUrl);
  }
}

export async function createCustomerPanel(phone: string) {
  const panel = await prisma.customerPanel.upsert({
    where: { phone },
    create: { phone },
    update: {},
  });

  return `${env.NEXT_PUBLIC_WEBSITE_URL}/ocasioes/${panel.id}`;
}

export async function createOccasion(data: {
  customerPanelId: string;
  type: OccasionType;
  customName?: string;
  personName: string;
  date: Date;
  advanceDays: number;
}) {
  return prisma.occasion.create({ data });
}

export async function updateOccasion(
  id: string,
  data: {
    type?: OccasionType;
    customName?: string | null;
    personName?: string;
    date?: Date;
    advanceDays?: number;
  },
) {
  return prisma.occasion.update({ where: { id }, data });
}

export async function deleteOccasion(id: string) {
  return prisma.occasion.delete({ where: { id } });
}
