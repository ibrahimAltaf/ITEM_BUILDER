import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { success } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import mongoose from "mongoose";
import { resolveCartForCheckout } from "../cart/cart.service";
import { getAddressForUser, addressToShippoInput } from "../address/address.service";
import { getShippingRates } from "../../services/shippo.service";
import { shippingRatesQuerySchema } from "./shipping.schemas";

function validationError(issues: { message: string }[]): never {
  throw new AppError(400, issues.map((e) => e.message).join("; "));
}

export async function getRates(req: AuthRequest, res: Response): Promise<Response> {
  const parsed = shippingRatesQuerySchema.safeParse(req.query);
  if (!parsed.success) validationError(parsed.error.issues as { message: string }[]);
  const { addressId } = parsed.data!;
  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const resolved = await resolveCartForCheckout(userId);
  const addrDoc = await getAddressForUser(addressId, userId);
  const to = addressToShippoInput(addrDoc.toObject());

  const result = await getShippingRates(to, resolved.parcel);

  return success(res, 200, "Shipping rates retrieved.", {
    shipmentObjectId: result.shipmentObjectId,
    rates: result.rates.map((r) => ({
      objectId: r.object_id,
      amount: r.amount,
      currency: r.currency,
      provider: r.provider,
      service: r.servicelevel?.name ?? r.servicelevel?.token ?? "",
      estimatedDays: r.estimated_days ?? null,
      durationTerms: r.duration_terms ?? "",
    })),
  });
}
