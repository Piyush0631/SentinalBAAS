import Groq from "groq-sdk";
import AppError from "../../../utils/apperror.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TIMEOUT_MS = 10000;

export async function callGroq(sanitizedPayload) {
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
      () => reject(new AppError("Groq request timed out", 504, "AI_TIMEOUT")),
      TIMEOUT_MS,
    ),
  );

  let aiResponse;
  try {
    aiResponse = await Promise.race([
      groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 512,
        response_format: { type: "json_object" },
      }),
      timeoutPromise,
    ]);
  } catch (error) {
    throw new AppError(
      "Groq API call failed: " + error.message,
      502,
      "AI_ERROR",
    );
  }

  const content = aiResponse.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError("Groq response missing content", 502, "AI_ERROR");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AppError("Groq response is not valid JSON", 502, "AI_ERROR");
  }

  if (
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.recommendations) ||
    !parsed.recommendations.every((r) => typeof r === "string") ||
    !["Low", "Medium", "High"].includes(parsed.severity)
  ) {
    throw new AppError(
      "Groq response does not match contract",
      502,
      "AI_ERROR",
    );
  }

  return parsed;
}
