import prisma from "@/lib/prisma";

export async function resolveNameByPhone(phone: string): Promise<string> {
  const contact = await prisma.contact.findUnique({
    where: { phone },
    select: { name: true },
  });
  if (contact) return contact.name;

  const lead = await prisma.lead.findUnique({
    where: { phone },
    select: { name: true },
  });
  if (lead) return lead.name;

  return "Cliente";
}
