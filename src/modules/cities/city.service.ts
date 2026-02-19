import { UF } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import createHttpError from "http-errors";

export const createCityIfNotExists = async (body: {
  ibge: string;
  name: string;
  uf: UF;
}) => {
  if (!body.ibge)
    throw new createHttpError.BadRequest("IBGE não pode ser nulo");

  try {
    const city = await prisma.city.create({
      data: {
        ibge: body.ibge,
        name: body.name,
        uf: body.uf,
      },
    });
    return city;
  } catch (e: any) {
    if (e.code === "P2002") {
      const city = await prisma.city.findUniqueOrThrow({
        where: {
          ibge: body.ibge,
        },
      });
      return city;
    }
    throw e;
  }
};
