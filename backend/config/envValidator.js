const arr = [
  "PORT",
  "DATABASE",
  "DATABASE_PASSWORD",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
];

export const validateEnv = () => {
  const missingVars = arr.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }
};
