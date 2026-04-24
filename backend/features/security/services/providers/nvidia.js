import OpenAI from "openai";
import AppError from "../../../../utils/apperror.js";

const TIMEOUT_MS = 10000;
let nvidiaClient = null;

function getNvidiaClient() {
  if (!nvidiaClient) {
    nvidiaClient = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }
  return nvidiaClient;
}

export async function callNvidia(sanitizedPayload) {
  const nvidia = getNvidiaClient();
  const prompt = `Analyze the following API security issues and return a JSON object with this exact contract:

{
  "summary": "string",
  "recommendations": ["string"],
  "severity": "Low" | "Medium" | "High"
}

Only return valid JSON, no markdown, no preamble.
Input: ${JSON.stringify(sanitizedPayload)}`;

  const timeoutPromise = new Promise((_, reject) =>
    globalThis.setTimeout(
      () => reject(new AppError("NVIDIA request timed out", 504, "AI_TIMEOUT")),
      TIMEOUT_MS,
    ),
  );

  let aiResponse;
  try {
    aiResponse = await Promise.race([
      nvidia.chat.completions.create({
        model: "mistralai/mistral-nemotron",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 512,
        response_format: { type: "json_object" },
      }),
      timeoutPromise,
    ]);
  } catch (error) {
    throw new AppError(
      "NVIDIA API call failed: " + error.message,
      502,
      "AI_ERROR",
    );
  }

  const content = aiResponse.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError("NVIDIA response missing content", 502, "AI_ERROR");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AppError("NVIDIA response is not valid JSON", 502, "AI_ERROR");
  }

  if (
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.recommendations) ||
    !parsed.recommendations.every((r) => typeof r === "string") ||
    !["Low", "Medium", "High"].includes(parsed.severity)
  ) {
    throw new AppError(
      "NVIDIA response does not match contract",
      502,
      "AI_ERROR",
    );
  }

  return parsed;
}
