import app from './app';
import { CONFIG } from './config/config';
import { logger } from './utils/logger';
import { connectDB, closeDB } from './config/db';

async function bootstrap() {
  try {
    // 1. Initialize MongoDB connection
    await connectDB();
    logger.info('MongoDB database connected successfully.');

    // 2. Start HTTP Server
    const server = app.listen(CONFIG.PORT, () => {
      logger.info(`Sutriva Backend & Food API running on port ${CONFIG.PORT} in ${CONFIG.NODE_ENV} mode`);
      logger.info(`Food API ready at http://localhost:${CONFIG.PORT}/api/v1/food`);
    });

    // Graceful Shutdown Handler
    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await closeDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
}

bootstrap();
