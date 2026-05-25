import { sanitizeForLog } from "../../utils/sanitization.js";

describe("sanitizeForLog", () => {
  it("should redact sensitive fields", () => {
    const input = {
      "x-api-key": "123",
      authorization: "Bearer abc",
      password: "secret",
      token: "tok",
      normal: "ok",
    };
    const result = sanitizeForLog(input);
    expect(result["x-api-key"]).toBe("[REDACTED]");
    expect(result["authorization"]).toBe("[REDACTED]");
    expect(result["password"]).toBe("[REDACTED]");
    expect(result["token"]).toBe("[REDACTED]");
    expect(result["normal"]).toBe("ok");
  });

  it("should return non-object as is", () => {
    expect(sanitizeForLog(null)).toBe(null);
    expect(sanitizeForLog(42)).toBe(42);
  });
});
