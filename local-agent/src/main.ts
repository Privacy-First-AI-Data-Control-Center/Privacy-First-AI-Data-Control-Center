import { ConfigService } from './config/config.service.js';
import { buildServer } from './server/http-server.js';

async function bootstrap(): Promise<void> {
  const config = new ConfigService();
  const server = await buildServer({ configService: config });

  if (config.isUsingDefaultDevToken) {
    server.log.warn(
      'Using default development LOCAL_WEBHOOK_TOKEN. Set a unique secret in .env before connecting real hooks.',
    );
  }

  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    server.log.info({ signal }, 'Received termination signal, shutting down gracefully...');
    try {
      await server.close();
      server.log.info('Local agent HTTP server closed cleanly.');
      process.exit(0);
    } catch (error) {
      server.log.error({ err: error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  try {
    const address = await server.listen({
      host: config.host,
      port: config.port,
    });
    server.log.info(
      {
        address,
        env: config.nodeEnv,
        backendBaseUrl: config.backendBaseUrl,
      },
      'Privacy-First AI Local Monitoring Agent started',
    );
  } catch (error) {
    server.log.error({ err: error }, 'Failed to start local agent server');
    process.exit(1);
  }
}

await bootstrap();
