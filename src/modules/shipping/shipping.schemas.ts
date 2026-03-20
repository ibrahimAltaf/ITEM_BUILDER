import { z } from "zod";

export const shippingRatesQuerySchema = z.object({
  addressId: z.string().min(1),
});
