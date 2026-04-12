// Email validation using simple regex (for controller-level check)
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  // Basic RFC 5322 compliant regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Username: 3-30 chars, letters, numbers, underscores only
export function isValidUsername(username) {
  if (typeof username !== "string") return false;
  return /^[A-Za-z0-9_]{3,30}$/.test(username);
}
const suspiciousPatterns = [
  /('|")\s*or\s*1=1/i,
  /('|")\s*--/,
  /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b)/i,
  /<script.*?>/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /javascript:/i,
  /\$\{.*?\}/,
  /\{\{.*?\}\}/,
  /<img\s+src=/i,
  /<iframe/i,
  /eval\(/i,
  /alert\(/i,
  /document\.cookie/i,
  /window\.location/i,
  /\$ne|\$gt|\$lt|\$or|\$where|\$regex|\$expr/,
];

export function isSuspiciousInput(value) {
  if (typeof value !== "string") return false;
  return suspiciousPatterns.some((regex) => {
    regex.lastIndex = 0;
    return regex.test(value);
  });
}

export function sanitizeString(value) {
  if (typeof value !== "string") return value;

  return value
    .trim()
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
