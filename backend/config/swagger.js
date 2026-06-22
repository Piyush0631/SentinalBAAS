import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SentinelBaaS API",
      version: "1.0.0",
      description: "AI security analyzer and backend-as-a-service platform",
    },
    servers: [
      {
        url: "http://localhost:7001",
        description: "Local development",
      },
      {
        url: "https://sentinalbaas.onrender.com",
        description: "Production",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token in HTTP-only cookie",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API key for project data access",
        },
      },
    },
  },
  apis: ["./features/**/routes/*.js"],
};

export default swaggerJsdoc(options);
