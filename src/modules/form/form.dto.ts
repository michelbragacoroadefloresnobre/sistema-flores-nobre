import { Prisma } from "@/generated/prisma/client";

export type FormTableItem = Prisma.FormGetPayload<{
  include: {
    conversionMessages: true;
  };
}>;
