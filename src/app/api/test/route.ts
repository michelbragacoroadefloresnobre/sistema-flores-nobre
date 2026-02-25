import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";

export async function GET() {
  await auth.api.createUser({
    body: {
      email: "dev.igorbraga@outlook.com",
      name: "Igor Braga",
      password: "test123",
      data: {
        role: Role.OWNER,
        helenaId: "test",
      },
    },
  });
}
