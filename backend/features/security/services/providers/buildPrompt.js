export function buildPrompt(payload) {
  return `You are an API security analyst reviewing request logs for a Backend-as-a-Service platform.

Deterministic rules have already detected these issues — DO NOT repeat or rephrase them:
${JSON.stringify(payload.issues, null, 2)}

Here is structural metadata from the last ${payload.logSample?.length ?? 0} requests:
${JSON.stringify(payload.logSample, null, 2)}

Overall traffic summary:
${JSON.stringify(payload.summary, null, 2)}

Your job is to find security patterns the deterministic rules MISSED.
Look for:
- Timing anomalies (burst requests, unusual hours, bot-like intervals)
- Endpoint abuse (same path hammered repeatedly)
- Reconnaissance behavior (probing multiple routes systematically)
- Unusual method/path combinations
- Suspicious field name combinations in bodyKeys
- Anomalous user-agent strings indicating bots or attack tools
- Unexpected origin headers

Return ONLY valid JSON, no markdown, no explanation outside the JSON:
{
  "summary": "string",
  "newFindings": [
    {
      "issue": "string",
      "severity": "Low|Medium|High",
      "evidence": "string"
    }
  ],
  "recommendations": ["string"],
  "overallSeverity": "Low|Medium|High"
}

If you find nothing new, return newFindings as an empty array. Do not invent findings.`;
}
