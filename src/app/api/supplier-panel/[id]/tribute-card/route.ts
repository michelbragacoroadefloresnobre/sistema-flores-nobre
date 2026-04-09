import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import createHttpError from "http-errors";
import { buildTributeCardPdf } from "./build-pdf";

export const GET = createRoute(
  async (req, { params }) => {
    const { id } = params;

    const panel = await prisma.supplierPanel.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            senderName: true,
            honoreeName: true,
            tributeCardPhrase: true,
          },
        },
      },
    });

    if (!panel) throw createHttpError.NotFound("Painel não encontrado");
    if (!panel.order.tributeCardPhrase)
      throw createHttpError.BadRequest(
        "Este pedido não possui cartão de homenagem",
      );

    const pdfBuffer = await buildTributeCardPdf({
      senderName: panel.order.senderName,
      honoreeName: panel.order.honoreeName,
      tributeCardPhrase: panel.order.tributeCardPhrase,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cartao-homenagem.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  },
  { public: true },
);
