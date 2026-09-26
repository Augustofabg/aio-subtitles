import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserConfig } from '../types/config';
import { Logger } from '../utils/logger';

export interface StoredConfigRecord {
  uuid: string;
  passwordHash: string;
  config: UserConfig;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'configurations.json');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(str: string): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str.trim());
}

class ConfigStorage {
  private cache: Map<string, StoredConfigRecord> = new Map();
  private initialized = false;

  private ensureInitialized(): void {
    if (this.initialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          for (const [k, v] of Object.entries(parsed)) {
            this.cache.set(k.toLowerCase(), v as StoredConfigRecord);
          }
        }
      }
    } catch (err) {
      Logger.error('Failed to load configurations from store file', err);
    }

    this.initialized = true;
  }

  private persist(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const obj: Record<string, StoredConfigRecord> = {};
      for (const [k, v] of this.cache.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      Logger.error('Failed to persist configurations to file', err);
    }
  }

  public getConfigByUuid(uuid: string): UserConfig | null {
    this.ensureInitialized();
    const cleanUuid = uuid.trim().toLowerCase();
    const record = this.cache.get(cleanUuid);
    return record ? record.config : null;
  }

  public saveConfig(
    uuid: string,
    passwordPlain: string,
    config: UserConfig
  ): { success: boolean; error?: string } {
    this.ensureInitialized();

    const cleanUuid = uuid.trim().toLowerCase();
    if (!isUuid(cleanUuid)) {
      return { success: false, error: 'Formato de UUID inválido.' };
    }

    if (!passwordPlain || passwordPlain.trim() === '') {
      return { success: false, error: 'A senha é obrigatória para salvar a configuração.' };
    }

    const existing = this.cache.get(cleanUuid);

    if (existing) {
      const match = bcrypt.compareSync(passwordPlain, existing.passwordHash);
      if (!match) {
        return { success: false, error: 'UUID ou senha inválidos.' };
      }

      existing.config = config;
      existing.updatedAt = new Date().toISOString();
      this.persist();
      Logger.info(`Updated configuration for UUID: ${cleanUuid}`);
      return { success: true };
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);

    const newRecord: StoredConfigRecord = {
      uuid: cleanUuid,
      passwordHash,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.cache.set(cleanUuid, newRecord);
    this.persist();
    Logger.info(`Created new configuration for UUID: ${cleanUuid}`);
    return { success: true };
  }

  public authenticateAndGetConfig(
    uuid: string,
    passwordPlain: string
  ): { success: boolean; config?: UserConfig; error?: string } {
    this.ensureInitialized();

    const cleanUuid = uuid.trim().toLowerCase();
    const existing = this.cache.get(cleanUuid);

    if (!existing) {
      return { success: false, error: 'UUID ou senha inválidos.' };
    }

    const match = bcrypt.compareSync(passwordPlain, existing.passwordHash);
    if (!match) {
      return { success: false, error: 'UUID ou senha inválidos.' };
    }

    return {
      success: true,
      config: existing.config
    };
  }
}

export const configStorage = new ConfigStorage();
