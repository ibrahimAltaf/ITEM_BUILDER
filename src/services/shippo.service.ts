import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const SHIPPO_BASE = "https://api.goshippo.com";

export type ShipAddressInput = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  /** APO/FPO/DPO — Shippo uses US + AA/AE/AP states */
  isMilitary?: boolean;
};

function authHeaders(): HeadersInit {
  if (!env.SHIPPO_API_TOKEN) {
    throw new AppError(503, "Shippo is not configured. Set SHIPPO_API_TOKEN in .env");
  }
  return {
    Authorization: `ShippoToken ${env.SHIPPO_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export function getShipFromAddress(): ShipAddressInput {
  if (!env.SHIP_FROM_STREET1 || !env.SHIP_FROM_CITY || !env.SHIP_FROM_ZIP) {
    throw new AppError(
      503,
      "Ship-from address incomplete. Set SHIP_FROM_STREET1, SHIP_FROM_CITY, SHIP_FROM_ZIP in .env"
    );
  }
  return {
    name: env.SHIP_FROM_NAME,
    street1: env.SHIP_FROM_STREET1,
    street2: env.SHIP_FROM_STREET2 || undefined,
    city: env.SHIP_FROM_CITY,
    state: env.SHIP_FROM_STATE,
    zip: env.SHIP_FROM_ZIP,
    country: env.SHIP_FROM_COUNTRY || "US",
    phone: env.SHIP_FROM_PHONE || undefined,
  };
}

function toShippoAddress(a: ShipAddressInput): Record<string, string> {
  return {
    name: a.name,
    street1: a.street1,
    street2: a.street2 ?? "",
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country,
    phone: a.phone ?? "",
  };
}

export type ParcelInput = {
  weightOz: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
};

export type ShippoRate = {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel?: { name?: string; token?: string };
  estimated_days?: number;
  duration_terms?: string;
};

export type ShippoRatesResult = {
  shipmentObjectId: string;
  rates: ShippoRate[];
};

/**
 * Create a Shippo shipment and return available rates (sync).
 */
export async function getShippingRates(
  to: ShipAddressInput,
  parcel: ParcelInput
): Promise<ShippoRatesResult> {
  const from = getShipFromAddress();
  const body = {
    address_from: toShippoAddress(from),
    address_to: toShippoAddress(to),
    parcels: [
      {
        length: String(parcel.lengthIn),
        width: String(parcel.widthIn),
        height: String(parcel.heightIn),
        distance_unit: "in",
        weight: String(parcel.weightOz),
        mass_unit: "oz",
      },
    ],
    async: false,
  };

  const res = await fetch(`${SHIPPO_BASE}/shipments/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Shippo error:", res.status, text);
    throw new AppError(502, "Shippo rate request failed");
  }

  const data = (await res.json()) as {
    object_id?: string;
    rates?: ShippoRate[];
    messages?: { text?: string }[];
  };

  if (data.messages?.length) {
    const msg = data.messages.map((m) => m.text).filter(Boolean).join("; ");
    if (msg) console.warn("Shippo messages:", msg);
  }

  const rates = Array.isArray(data.rates) ? data.rates : [];
  if (!data.object_id) {
    throw new AppError(502, "Shippo returned no shipment id");
  }

  return { shipmentObjectId: data.object_id, rates };
}

/**
 * Verify a selected rate still exists and return amount in USD (dollars).
 */
export type ShippoRateDetails = {
  amountUsd: number;
  /** Parent shipment object_id (for purchasing labels later) */
  shipmentObjectId: string;
};

export async function getRateDetails(
  shippoRateObjectId: string
): Promise<ShippoRateDetails> {
  const res = await fetch(`${SHIPPO_BASE}/rates/${shippoRateObjectId}/`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new AppError(400, "Invalid or expired shipping rate. Request new rates.");
  }
  const data = (await res.json()) as {
    amount?: string;
    currency?: string;
    shipment?: string;
  };
  const amount = data.amount != null ? Number(data.amount) : NaN;
  if (!Number.isFinite(amount) || (data.currency && data.currency !== "USD")) {
    throw new AppError(502, "Could not read shipping rate amount");
  }

  let shipmentObjectId = "";
  if (data.shipment) {
    const m = String(data.shipment).match(
      /\/shipments\/([0-9a-f]{24,32})\/?$/i
    );
    shipmentObjectId = m?.[1] ?? "";
  }

  return { amountUsd: amount, shipmentObjectId };
}
