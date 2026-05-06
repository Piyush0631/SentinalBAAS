/* global fetch */
/* global AbortController, setTimeout, clearTimeout */
import RequestLog from "../../../models/RequestLog.js";
import SecurityReport from "../../../models/SecurityReport.js";
import { sanitizeLogs } from "./sanitizeLogs.js";
import { callGroq } from "./providers/groq.js";
import { callNvidia } from "./providers/nvidia.js";
import redis from "../../../utils/redisClient.js";
// Retry helper for AI providers
async function withRetry(fn, args, retries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(...args);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
function checkMissingApiKey(logs) {
  const affected = logs.filter((log) => !log.hadApiKey);
  if (affected.length === 0) return null;
  return {
    rule: "missing-api-key",
    issue: `${affected.length} requests were made without an API key`,
    severity: "High",
    affectedCount: affected.length,
  };
}
async function fetchGeoLocation(ip, timeoutMs = 4000) {
  const cacheKey = `geo:${ip}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://ip-api.com/json/${ip}?fields=country,regionName,city,status`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      return null;
    }
    const geoData = await response.json();
    await redis.set(cacheKey, JSON.stringify(geoData), "EX", 604800);
    return geoData;
  } catch (err) {
    console.warn(`Geo lookup failed for ${ip}:`, err.message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkSuspiciousTraffic(logs) {
  const threshold = 0.7;
  if (!Array.isArray(logs) || logs.length === 0) return null;

  const ipCounts = {};
  logs.forEach((log) => {
    const ip = log.ip;
    if (!ip || ip === "unknown") return;
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
  });

  const suspicious = Object.entries(ipCounts).filter(
    ([, count]) => count > logs.length * threshold,
  );

  //Geo anomaly check
  const uniqueIps = [
    ...new Set(logs.map((l) => l.ip).filter((ip) => ip && ip !== "unknown")),
  ];

  let geoFindings = null;
  if (uniqueIps.length > 0) {
    try {
      const geoResults = await Promise.all(
        uniqueIps.map((ip) => fetchGeoLocation(ip)),
      );

      const successfulResults = geoResults.filter(
        (g) => g && g.status === "success",
      );

      const uniqueCountries = [
        ...new Set(successfulResults.map((g) => g.country)),
      ];

      const locations = [
        ...new Set(successfulResults.map((g) => `${g.country} (${g.city})`)),
      ];

      if (uniqueCountries.length > 3) {
        geoFindings = {
          rule: "geo-anomaly",
          issue: `Requests from ${uniqueCountries.length} different countries: ${locations.join(", ")}`,
          severity: "Medium",
          affectedCount: uniqueCountries.length,
        };
      }
    } catch (err) {
      console.error("Geo lookup failed:", err.message);
    }
  }

  const trafficFindings = suspicious.map(([ip, count]) => ({
    rule: "suspicious-traffic",
    issue: `IP ${ip} made ${count} of ${logs.length} total requests`,
    severity: "Medium",
    affectedCount: count,
    ip,
  }));

  const allFindings = [
    ...trafficFindings,
    ...(geoFindings ? [geoFindings] : []),
  ];

  return allFindings.length === 0 ? null : allFindings;
}
function checkHighErrorRate(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return null;

  const failed = logs.filter((log) => log.responseStatus >= 400);
  const errorRate = (failed.length / logs.length) * 100;

  if (errorRate < 20) return null;

  return {
    rule: "high-error-rate",
    issue: `${errorRate.toFixed(1)}% of requests failed (${failed.length} of ${logs.length})`,
    severity: errorRate > 50 ? "High" : "Medium",
    affectedCount: failed.length,
  };
}
function checkInjectionProbes(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return null;

  const patterns = [
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

  function containsPattern(value) {
    if (typeof value !== "string") return false;
    return patterns.some((regex) => {
      regex.lastIndex = 0;
      return regex.test(value);
    });
  }

  function checkObject(obj) {
    if (!obj || typeof obj !== "object") return false;
    return Object.values(obj).some((val) => containsPattern(String(val)));
  }

  const affected = logs.filter((log) => {
    return (
      checkObject(log.body) ||
      checkObject(log.query) ||
      checkObject(log.headers)
    );
  });

  if (affected.length === 0) return null;

  return {
    rule: "injection-probe",
    issue: `${affected.length} requests contained suspicious injection patterns`,
    severity: "High",
    affectedCount: affected.length,
  };
}

function checkUnknownFields(logs, recordSchema) {
  if (!recordSchema) return null;
  const allowedFields = Object.keys(recordSchema);
  const affected = logs.filter((log) => {
    if (!log.body || typeof log.body !== "object") return false;
    return Object.keys(log.body).some((key) => !allowedFields.includes(key));
  });
  if (affected.length === 0) return null;
  return {
    rule: "unknown-fields",
    issue: `${affected.length} requests sent fields not defined in project schema`,
    severity: "Medium",
    affectedCount: affected.length,
  };
}
function checkDeleteSpike(logs) {
  if (logs.length === 0) return null;
  const deletes = logs.filter((log) => log.method === "DELETE");
  const deleteRate = (deletes.length / logs.length) * 100;
  if (deleteRate < 30) return null;
  return {
    rule: "delete-spike",
    issue: `${deleteRate.toFixed(1)}% of requests were DELETE operations`,
    severity: "Medium",
    affectedCount: deletes.length,
  };
}

async function runDeterministicChecks(logs, recordSchema) {
  const results = await Promise.all([
    checkMissingApiKey(logs),
    checkHighErrorRate(logs),
    checkInjectionProbes(logs),
    checkSuspiciousTraffic(logs),
    checkUnknownFields(logs, recordSchema),
    checkDeleteSpike(logs),
  ]);
  return results.flat().filter(Boolean);
}

export async function analyzeProject(project) {
  //Load last 100 logs for the project
  const logs = await RequestLog.find({ projectId: project._id })
    .sort({ timestamp: -1 })
    .limit(100);

  if (logs.length < 5) {
    return await SecurityReport.create({
      projectId: project._id,
      deterministicFindings: [],
      aiFindings: null,
      status: "deterministic-only",
      analyzerVersion: "v1.0",
      inputSummary: {
        totalRequests: logs.length,
        note: "Insufficient data — need at least 5 requests to analyze",
      },
    });
  }

  const deterministicFindings = await runDeterministicChecks(
    logs,
    project.recordSchema,
  );
  // Build input summary for the report
  const failed = logs.filter((l) => l.responseStatus >= 400);
  const uniqueRoutes = [...new Set(logs.map((l) => l.path))];
  const inputSummary = {
    totalRequests: logs.length,
    failedRequests: failed.length,
    uniqueRoutes,
    analyzedAt: new Date().toISOString(),
  };

  const sanitizedPayload = sanitizeLogs(logs, deterministicFindings);
  let aiFindings = null;
  let status = "deterministic-only";
  try {
    aiFindings = await withRetry(callGroq, [sanitizedPayload], 1); // 1 retry
    status = "full";
  } catch (err) {
    console.error("Groq AI enrichment failed:", err.message);
    // Try NVIDIA fallback
    try {
      aiFindings = await withRetry(callNvidia, [sanitizedPayload], 1); // 1 retry
      status = "partial";
    } catch (nvidiaErr) {
      console.error("NVIDIA AI enrichment failed:", nvidiaErr.message);
    }
  }

  const report = await SecurityReport.create({
    projectId: project._id,
    deterministicFindings,
    aiFindings,
    status,
    analyzerVersion: "v1.0",
    inputSummary,
  });

  return report;
}
