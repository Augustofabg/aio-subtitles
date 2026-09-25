export interface ProviderConfigItem {
  enabled: boolean;
  apiKey?: string;
  username?: string;
  password?: string;
  customEndpoint?: string;
}

export interface CustomAddonConfig {
  id: string;
  name: string;
  manifestUrl: string;
  enabled: boolean;
}

export interface UserConfig {
  providers: Record<string, ProviderConfigItem>;
  customAddons: CustomAddonConfig[];
  providerPriority: string[];
  languages: string[];
  allowUnknownLanguages: boolean;
  languageRemap: Record<string, string>;
  namingTemplate: string;
  providerTimeoutMs: number;
  deduplication: boolean;
  proxySubtitles: boolean;
  cacheTtlMinutes: number;
}

export type PartialUserConfig = Partial<Omit<UserConfig, 'providers' | 'languageRemap'>> & {
  providers?: Record<string, Partial<ProviderConfigItem>>;
  languageRemap?: Record<string, string>;
};
