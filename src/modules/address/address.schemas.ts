import { z } from "zod";

const usZip = z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid US ZIP");
const militaryZip = z.string().regex(/^09\d{3}(-\d{4})?$/, "Military mail must use 09xxx ZIP");

/** Zod v4: cannot use .partial() on schemas with .superRefine() — keep base object separate */
const addressFieldShape = {
  label: z.string().max(80).optional().default("Home"),
  fullName: z.string().min(1).trim(),
  phone: z.string().optional().default(""),
  line1: z.string().min(1).trim(),
  line2: z.string().optional().default(""),
  city: z.string().min(1).trim(),
  state: z.string().min(2).max(2).toUpperCase(),
  zip: z.string().min(3).trim(),
  country: z.string().length(2).toUpperCase().default("US"),
  isMilitary: z.boolean().optional().default(false),
  militaryType: z.enum(["APO", "FPO", "DPO"]).nullable().optional(),
  isDefault: z.boolean().optional().default(false),
};

function refineAddress(
  data: {
    country: string;
    isMilitary: boolean;
    state: string;
    city: string;
    zip: string;
  },
  ctx: z.RefinementCtx
): void {
  if (data.country !== "US") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Only US addresses (including APO/FPO/DPO) are supported for checkout",
    });
  }
  if (data.isMilitary) {
    const st = data.state.toUpperCase();
    if (!["AA", "AE", "AP"].includes(st)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Military addresses must use state AA, AE, or AP",
      });
    }
    const cityUp = data.city.toUpperCase();
    if (!["APO", "FPO", "DPO"].includes(cityUp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City must be APO, FPO, or DPO for military mail",
      });
    }
    const zr = militaryZip.safeParse(data.zip);
    if (!zr.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: zr.error.issues[0]?.message ?? "Invalid military ZIP",
      });
    }
  } else {
    const zr = usZip.safeParse(data.zip);
    if (!zr.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: zr.error.issues[0]?.message ?? "Invalid ZIP",
      });
    }
  }
}

export const createAddressSchema = z
  .object(addressFieldShape)
  .superRefine((data, ctx) => refineAddress(data, ctx));

/**
 * PATCH: all fields optional; validate US/military rules only when relevant fields are sent.
 */
export const updateAddressSchema = z
  .object({
    label: z.string().max(80).optional(),
    fullName: z.string().min(1).trim().optional(),
    phone: z.string().optional(),
    line1: z.string().min(1).trim().optional(),
    line2: z.string().optional(),
    city: z.string().min(1).trim().optional(),
    state: z.string().min(2).max(2).optional(),
    zip: z.string().min(3).optional(),
    country: z.string().length(2).optional(),
    isMilitary: z.boolean().optional(),
    militaryType: z.enum(["APO", "FPO", "DPO"]).nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const keys = Object.keys(data).filter(
      (k) => data[k as keyof typeof data] !== undefined
    );
    if (keys.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field is required",
      });
      return;
    }

    const country = data.country?.toUpperCase();
    if (country !== undefined && country !== "US") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["country"],
        message:
          "Only US addresses (including APO/FPO/DPO) are supported for checkout",
      });
    }

    const touchesGeo =
      data.city !== undefined ||
      data.state !== undefined ||
      data.zip !== undefined ||
      data.isMilitary !== undefined ||
      data.country !== undefined;

    if (!touchesGeo) return;

    const isMilitary = data.isMilitary === true;
    const cityUp = data.city?.toUpperCase() ?? "";
    const milByCity = ["APO", "FPO", "DPO"].includes(cityUp);

    if (isMilitary || milByCity) {
      if (data.state !== undefined) {
        const st = data.state.toUpperCase();
        if (!["AA", "AE", "AP"].includes(st)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["state"],
            message: "Military addresses must use state AA, AE, or AP",
          });
        }
      }
      if (data.zip !== undefined) {
        const zr = militaryZip.safeParse(data.zip);
        if (!zr.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["zip"],
            message: zr.error.issues[0]?.message ?? "Invalid military ZIP",
          });
        }
      }
    } else if (data.zip !== undefined && data.isMilitary !== true) {
      const zr = usZip.safeParse(data.zip);
      if (!zr.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["zip"],
          message: zr.error.issues[0]?.message ?? "Invalid ZIP",
        });
      }
    }
  });
