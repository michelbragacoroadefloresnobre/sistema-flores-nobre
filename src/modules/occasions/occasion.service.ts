import { OccasionType } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { sendMessage } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { buildPanelInviteMessage } from "./message.templates";

export async function createCustomerPanelAndNotify(phone: string) {
  const panel = await prisma.customerPanel.upsert({
    where: { phone },
    create: { phone },
    update: {},
  });

  const panelUrl = `${env.NEXT_PUBLIC_WEBSITE_URL}/ocasioes/${panel.id}`;
  const message = buildPanelInviteMessage(panelUrl);

  await sendMessage(phone, message);
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
