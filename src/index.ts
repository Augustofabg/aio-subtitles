import { createServer } from './server';
import { ENV } from './config/env';
import { Logger } from './utils/logger';

const app = createServer();

app.listen(ENV.PORT, ENV.HOST, () => {
  Logger.info(`🚀 AIOSubtitles Stremio Addon listening on http://${ENV.HOST}:${ENV.PORT}`);
  Logger.info(`👉 Configure UI: http://localhost:${ENV.PORT}/configure`);
  Logger.info(`👉 Manifest: http://localhost:${ENV.PORT}/manifest.json`);
});
