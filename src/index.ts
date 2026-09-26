import { createServer } from './server';
import { ENV } from './config/env';
import { Logger } from './utils/logger';
import { configStorage } from './storage/configStore';

async function bootstrap(): Promise<void> {
  try {
    await configStorage.initialize();
  } catch (err) {
    Logger.error('Storage initialization warning:', err);
  }

  const app = createServer();

  app.listen(ENV.PORT, ENV.HOST, () => {
    Logger.info(`🚀 AIOSubtitles Stremio Addon listening on http://${ENV.HOST}:${ENV.PORT}`);
    Logger.info(`👉 Configure UI: http://localhost:${ENV.PORT}/configure`);
    Logger.info(`👉 Manifest: http://localhost:${ENV.PORT}/manifest.json`);
  });
}

bootstrap().catch(err => {
  Logger.error('Failed to start server bootstrap', err);
  process.exit(1);
});
