import { Router } from 'express';
import { getDatabaseHealth } from '../config/database.js';

const router = Router();

router.get('/health', (_req, res) => {
  const dbHealth = getDatabaseHealth();
  const isHealthy = dbHealth.isReady;

  const responsePayload = {
    success: true,
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'learnerne-api',
      version: '1.0.0',
      database: {
        status: dbHealth.status,
        readyState: dbHealth.readyState,
        isReady: dbHealth.isReady,
      },
    },
  };

  // 200 if connected, 503 if database readiness fails
  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(responsePayload);
});

export default router;
