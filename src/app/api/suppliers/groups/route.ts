import { createRoute } from "@/lib/handler/route-handler";
import { getSupplierGroups } from "@/lib/zapi";

export const revalidade = 0;

export const GET = createRoute(async () => {
  const groups = await getSupplierGroups();
  return { data: groups.filter((g) => g.name) };
});
