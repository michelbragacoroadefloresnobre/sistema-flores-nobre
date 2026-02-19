import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";

export async function GET() {
  auth.api.signUpEmail({
    body: {
      email: "dev.igorbraga@outlook.com",
      role: Role.OWNER,
      name: "Igor Braga",
      password: "Igor2025!#",
      helenaId: "5c8b2758-73d7-44c8-8c25-41494a2cbe91",
    },
  });
}
