import { createRoute } from "@/lib/handler/route-handler";
import {
  updateOccasion,
  deleteOccasion,
} from "@/modules/occasions/occasion.service";
import { updateOccasionSchema } from "@/modules/occasions/occasion.dto";

export const PATCH = createRoute(
  async (req, { params, body }) => {
    const { id } = params;
    const occasion = await updateOccasion(id, body);
    return { data: occasion };
  },
  {
    public: true,
    body: updateOccasionSchema,
  },
);

export const DELETE = createRoute(
  async (req, { params }) => {
    const { id } = params;
    await deleteOccasion(id);
    return "Ocasião removida com sucesso";
  },
  { public: true },
);
