import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.project?._id?.toString() || ipKeyGenerator(req), // ← use helper
  handler: (req, res) => {
    console.error(
      `AI rate limit hit — projectId: ${req.project?._id}, ip: ${req.ip}`,
    );
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_001",
        message:
          "AI analysis rate limit exceeded. Please try again in a minute.",
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default aiRateLimit;
