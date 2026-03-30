import { createRoute } from "@/lib/handler/route-handler";
import {
  createCoupon,
  listCoupons,
} from "@/modules/occasions/coupon.service";
import { createCouponSchema } from "@/modules/occasions/occasion.dto";

export const GET = createRoute(async () => {
  const coupons = await listCoupons();
  return { data: coupons };
});

export const POST = createRoute(
  async (req, { body }) => {
    const coupon = await createCoupon(body);
    return { data: coupon };
  },
  { body: createCouponSchema },
);
