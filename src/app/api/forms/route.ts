import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { subDays } from "date-fns";
import z from "zod";
import { QueryFormType } from "./query-form.dto.";

export const GET = createRoute(
  async (req, { searchParams }) => {
    const form = await prisma.form.findFirst({
      where: {
        phone: searchParams.phone,
        createdAt: { gt: subDays(new Date(), 1) },
      },
    });

    if (form) {
      return {
        data: {
          phone: form.phone,
          email: form.email,
          name: form.name,
        } satisfies QueryFormType,
      };
    }
    const customer = await prisma.contact.findFirst({
      where: { phone: searchParams.phone },
    });

    return {
      data: {
        phone: customer?.phone,
        email: customer?.email,
        name: customer?.name,
      } satisfies QueryFormType,
    };
  },
  {
    searchParams: z.object({ phone: z.string().min(8) }),
  },
);
