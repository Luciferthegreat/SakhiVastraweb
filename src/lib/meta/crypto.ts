import crypto from "crypto";

export function sha256(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function normalizePhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  // If Indian number without country code (10 digits), prepend 91
  if (digits.length === 10) {
    return sha256(`91${digits}`);
  }
  return sha256(digits);
}

export function generateEventId(prefix = "sv"): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `${prefix}_${timestamp}_${random}`;
}
