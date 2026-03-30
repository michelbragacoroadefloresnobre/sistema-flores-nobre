import { createRoute } from "@/lib/handler/route-handler";
import {
  updateCoupon,
  deleteCoupon,
} from "@/modules/occasions/coupon.service";
import { updateCouponSchema } from "@/modules/occasions/occasion.dto";

export const PATCH = createRoute(
  async (req, { params, body }) => {
    const { id } = params;
    const coupon = await updateCoupon(id, body);
    return { data: coupon };
  },
  { body: updateCouponSchema },
);

export const DELETE = createRoute(async (req, { params }) => {
  const { id } = params;
  await deleteCoupon(id);
  return "Cupom removido com sucesso";
});
