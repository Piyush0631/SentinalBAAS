import crypto from "crypto";

export function generateApiKey() {
  const randomPart = crypto
    .randomBytes(9)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12);
  return `sk_proj_${randomPart}`;
}
