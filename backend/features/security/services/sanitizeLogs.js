const SENSITIVE_HEADERS = ["authorization", "x-api-key", "cookie"];

function stripSensitiveHeaders(headers) {
  const clean = {};
  for (const key in headers) {
    if (!SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      clean[key] = headers[key];
    }
  }
  return clean;
}
function truncateBodyFields(body = {}) {
  const truncated = {};
  for (const key in body) {
    const value = body[key];
    if (typeof value === "string" && value.length > 500) {
      truncated[key] = value.substring(0, 500) + "...";
    } else {
      truncated[key] = value;
    }
  }
  return truncated;
}
function extractRelevantFields(log) {
  return {
    method: log.method,
    path: log.path || log.url,
    responseStatus: log.responseStatus,
    headers: stripSensitiveHeaders(log.headers ?? {}),
    body: truncateBodyFields(log.body ?? {}),
    bodyKeys:
      log.body && typeof log.body === "object" ? Object.keys(log.body) : [],
  };
}
function buildSummary(sanitizedLogs) {
  const totalRequests = sanitizedLogs.length;
  const failedRequests = sanitizedLogs.filter(
    (l) => l.responseStatus >= 400,
  ).length;
  const uniqueRoutes = [...new Set(sanitizedLogs.map((l) => l.path))];

  return {
    totalRequests,
    failedRequests,
    uniqueRoutes,
  };
}

export function sanitizeLogs(logs, deterministicFindings) {
  const sanitizedLogs = logs.map(extractRelevantFields);
  const summary = buildSummary(sanitizedLogs);
  return {
    issues: deterministicFindings,
    summary,
  };
}
