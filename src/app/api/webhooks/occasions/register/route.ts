import { LeadSource } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { createCustomerPanel } from "@/modules/occasions/occasion.service";
import z from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z
    .string()
    .regex(/^\d{12,13}$/, "Telefone deve ter 12 ou 13 dígitos numéricos"),
  email: z.string().email("Email inválido").optional(),
});

export const POST = createRoute(
  async (_req, { body }) => {
    const { name, phone, email } = body;

    await prisma.lead.upsert({
      where: { phone },
      create: { name, phone, email, source: LeadSource.SISTEMA_COROAS },
      update: { name, email },
    });

    const panelUrl = await createCustomerPanel(phone);

    return { data: { panelUrl } };
  },
  { body: registerSchema, public: true },
);
