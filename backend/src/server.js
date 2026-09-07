import "dotenv/config";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import { validateEnvironment } from "./config/env.js";

const startServer = async () => {
  try {
    validateEnvironment();

    await connectDatabase();

    const port = Number(process.env.PORT || 5000);

    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    server.on("error", (error) => {
      console.error(`Server failed to start: ${error.code || error.name}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();