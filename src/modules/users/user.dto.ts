import { Role } from "@/generated/prisma/enums";
import z from "zod";

export const userFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  helenaId: z.uuid("O ID Helena deve ser um UUID válido."),
  role: z.enum(Role, { message: "Selecione uma opção." }),
  email: z.email(),
});

export type UserFormData = z.infer<typeof userFormSchema>;
