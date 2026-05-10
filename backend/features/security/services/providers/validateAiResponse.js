import AppError from "../../../../utils/apperror.js";

const VALID_SEVERITIES = ["Low", "Medium", "High"];

function isValidFinding(finding) {
  return (
    finding &&
    typeof finding === "object" &&
    typeof finding.issue === "string" &&
    finding.issue.trim().length > 0 &&
    VALID_SEVERITIES.includes(finding.severity) &&
    typeof finding.evidence === "string" &&
    finding.evidence.trim().length > 0
  );
}

export function validateAiResponse(parsed, providerName) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AppError(
      `${providerName} response is not a valid object`,
      502,
      "AI_ERROR",
    );
  }

  if (
    typeof parsed.summary !== "string" ||
    parsed.summary.trim().length === 0 ||
    !Array.isArray(parsed.newFindings) ||
    !parsed.newFindings.every(isValidFinding) ||
    !Array.isArray(parsed.recommendations) ||
    !parsed.recommendations.every(
      (r) => typeof r === "string" && r.trim().length > 0,
    ) ||
    !VALID_SEVERITIES.includes(parsed.overallSeverity)
  ) {
    throw new AppError(
      `${providerName} response does not match contract`,
      502,
      "AI_ERROR",
    );
  }

  return parsed;
}
