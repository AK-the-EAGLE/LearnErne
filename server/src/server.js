import { createApp } from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';
import { fixWindowsDns } from "./config/dns.js";

fixWindowsDns();

async function bootstrap() {
  try {
    validateEnv();

    const app = createApp();

    // Connect to database
    try {
      console.log(`Connecting to MongoDB...`);
      await connectDB(env.MONGODB_URI);
      console.log(`Connected to MongoDB successfully.`);
    } catch (dbErr) {
      console.warn(`[WARN] MongoDB connection failed at startup: ${dbErr.message}`);
      console.warn(`[WARN] Server will start in degraded mode (health check will reflect database readiness).`);
    }

    const server = app.listen(env.PORT, () => {
      console.log(`LernErne API running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await disconnectDB();
          console.log('MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during database disconnect:', err);
          process.exit(1);
        }
      });

      // Force shutdown after timeout
      setTimeout(() => {
        console.error('Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error(`Bootstrap failure:`, err.message);
    process.exit(1);
  }
}

bootstrap();
