const ALLOWED_HEADERS_FOR_AI = [
  "origin", // detect unexpected request sources
  "user-agent", // detect bots and attack tools
  "content-type", // detect content-type confusion attacks
];

function stripSensitiveHeaders(headers) {
  const clean = {};
  for (const key in headers) {
    if (ALLOWED_HEADERS_FOR_AI.includes(key.toLowerCase())) {
      clean[key] = headers[key];
    }
  }
  return clean;
}

function extractRelevantFields(log) {
  return {
    method: log.method,
    path: log.path || log.url,
    responseStatus: log.responseStatus,
    headers: stripSensitiveHeaders(log.headers ?? {}),
    bodyKeys:
      log.body && typeof log.body === "object" ? Object.keys(log.body) : [],
    ip: log.ip ? log.ip.replace(/\.\d+$/, ".xxx") : "unknown",
    timestamp: log.timestamp,
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
    logSample: sanitizedLogs.slice(0, 20),
  };
}
