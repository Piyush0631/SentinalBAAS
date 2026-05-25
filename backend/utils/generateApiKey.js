import crypto from "crypto";

export function generateApiKey() {
  const randomPart = crypto.randomBytes(6).toString("hex");
  return `sk_proj_${randomPart}`;
}
