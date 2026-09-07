export function validateEnvironment() {
  const requiredVariables = [
    "MONGODB_URI",
    "JWT_SECRET",
    "CLIENT_URL",
  ];

  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing environment variables: ${missingVariables.join(", ")}`
    );
  }

  if (Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes");
  }

  if (!/^mongodb(\+srv)?:\/\//.test(process.env.MONGODB_URI)) {
    throw new Error("MONGODB_URI must be a MongoDB connection string");
  }

  let clientUrl;

  try {
    clientUrl = new URL(process.env.CLIENT_URL);
  } catch {
    throw new Error("CLIENT_URL must be a valid URL");
  }

  if (
    !["http:", "https:"].includes(clientUrl.protocol) ||
    process.env.CLIENT_URL !== clientUrl.origin
  ) {
    throw new Error(
      "CLIENT_URL must be an HTTP or HTTPS origin without a path or trailing slash"
    );
  }

  const port = Number(process.env.PORT || 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
}