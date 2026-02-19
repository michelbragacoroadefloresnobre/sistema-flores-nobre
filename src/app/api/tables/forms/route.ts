import { Prisma } from "@/generated/prisma/client";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { formFilterOptionsSchema } from "@/modules/form/form-table.dto";
import { FormTableItem } from "@/modules/form/form.dto";

export const GET = createRoute(
  async (req, { searchParams }) => {
    const where: Prisma.FormFindManyArgs["where"] = {};

    if (searchParams.createdAtStart || searchParams.createdAtEnd) {
      const startDate = searchParams.createdAtStart
        ? new Date(searchParams.createdAtStart)
        : undefined;
      const endDate = searchParams.createdAtEnd
        ? new Date(searchParams.createdAtEnd)
        : undefined;
      if (!startDate)
        where.createdAt = {
          lte: endDate,
        };
      else if (!endDate)
        where.createdAt = {
          gte: startDate,
        };
      else
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
    }

    if (searchParams.status) {
      where.status = searchParams.status;
    }

    if (searchParams.name) {
      where.name = {
        contains: searchParams.name,
        mode: "insensitive",
      };
    }

    if (searchParams.email) {
      where.email = {
        contains: searchParams.email,
        mode: "insensitive",
      };
    }

    if (searchParams.phone) {
      where.phone = {
        contains: searchParams.phone,
        mode: "insensitive",
      };
    }

    if (searchParams.sellers && searchParams.sellers.length > 0) {
    }

    const forms = await prisma.form.findMany({
      where,
      include: {
        conversionMessages: true,
      },
    });

    const fOrders = forms satisfies FormTableItem[];

    return { data: fOrders };
  },
  {
    searchParams: formFilterOptionsSchema,
  },
);
