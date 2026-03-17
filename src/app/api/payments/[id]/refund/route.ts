import { Role } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import { hasRoles } from "@/lib/utils";
import { refundPayment } from "@/modules/payments/payment.service";
import createHttpError from "http-errors";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.SUPERVISOR, Role.OWNER];

export const POST = createRoute(async (req, { params, auth }) => {
  if (!auth) {
    throw createHttpError.Unauthorized("Usuário não autorizado");
  }

  const userRole = (auth.user as any).role as Role;

  if (!hasRoles(ALLOWED_ROLES, userRole)) {
    throw createHttpError.Forbidden(
      "Usuário sem permissão para estornar pagamentos",
    );
  }

  const { reason, amount } = await req.json();

  if (!reason || typeof reason !== "string" || !reason.trim()) {
    throw createHttpError.BadRequest("Motivo do estorno é obrigatório");
  }

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw createHttpError.BadRequest("Valor do estorno inválido");
  }

  const amountInCents = Math.round(parsedAmount * 100);

  const updated = await refundPayment({
    paymentId: params.id,
    reason: reason.trim(),
    amountInCents,
  });

  revalidatePath(`/pedidos/${updated.orderId}`);

  return {
    message: "Pagamento estornado com sucesso",
  };
});
