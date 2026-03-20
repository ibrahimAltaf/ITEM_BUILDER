import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export type TaxAddress = {
  country: string;
  state: string;
  zip: string;
  city?: string;
  street?: string;
};

export type TaxLineItem = {
  /** Taxable line total in dollars (after discounts, before tax) */
  amount: number;
  quantity: number;
};

/**
 * Sales tax: TaxJar when configured; else CA-only fallback rate for California destinations.
 */
export async function calculateSalesTax(params: {
  from: TaxAddress;
  to: TaxAddress;
  shippingUsd: number;
  lineItems: TaxLineItem[];
}): Promise<{ taxUsd: number; source: "taxjar" | "ca_fallback" | "none" }> {
  const { from, to, shippingUsd, lineItems } = params;
  const orderSubtotal = lineItems.reduce(
    (s, li) => s + li.amount * Math.max(1, li.quantity),
    0
  );
  const taxableBase = Math.max(0, orderSubtotal + shippingUsd);

  if (env.TAXJAR_API_KEY) {
    const amount = Number(orderSubtotal.toFixed(2));
    const shipping = Number(shippingUsd.toFixed(2));
    const res = await fetch("https://api.taxjar.com/v2/taxes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TAXJAR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_country: from.country,
        from_zip: from.zip,
        from_state: from.state,
        from_city: from.city ?? "",
        from_street: from.street ?? "",
        to_country: to.country,
        to_zip: to.zip,
        to_state: to.state,
        to_city: to.city ?? "",
        to_street: to.street ?? "",
        amount,
        shipping,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("TaxJar error:", res.status, text);
      throw new AppError(502, "Tax calculation failed (TaxJar)");
    }

    const data = (await res.json()) as { tax?: { amount_to_collect?: number } };
    const tax = data.tax?.amount_to_collect ?? 0;
    return { taxUsd: Number(tax), source: "taxjar" };
  }

  /** Fallback: seller ships from CA — common case is charging CA district tax on CA shipments */
  if (to.country === "US" && to.state.toUpperCase() === "CA" && env.CA_FALLBACK_TAX_RATE > 0) {
    const taxUsd = taxableBase * env.CA_FALLBACK_TAX_RATE;
    return { taxUsd: Number(taxUsd.toFixed(2)), source: "ca_fallback" };
  }

  /** No tax engine — return 0 (nexus rules vary; configure TaxJar for production) */
  return { taxUsd: 0, source: "none" };
}
