export interface ProviderConfigItem {
  enabled: boolean;
  apiKey?: string;
  username?: string;
  password?: string;
  customEndpoint?: string;
}

export interface UserConfig {
  providers: Record<string, ProviderConfigItem>;
  providerPriority: string[];
  languages: string[];
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
