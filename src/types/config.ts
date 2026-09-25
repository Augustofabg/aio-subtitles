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
  logo?: string;
  description?: string;
  timeout?: number;
  resources?: string[];
  selectedResources?: string[];
  configurable?: boolean;
  configurationURL?: string;
}

export interface UserConfig {
  // Instance branding (Home page)
  instanceName?: string;
  instanceDesc?: string;
  instanceLogo?: string;
  instanceVersion?: string;

  // Services & Addons
  providers: Record<string, ProviderConfigItem>;
  customAddons: CustomAddonConfig[];
  addonFetchingStrategy?: 'default' | 'fastest';

  // Filters & Ordering
  providerPriority: string[];
  languages: string[];
  allowUnknownLanguages: boolean;
  languageRemap: Record<string, string>;
  providerTimeoutMs: number;
  deduplication: boolean;
  deduplicationStrategy?: 'both' | 'hash' | 'fuzzy';

  // System & Cache
  cacheTtlMinutes: number;
}

export type PartialUserConfig = Partial<Omit<UserConfig, 'providers' | 'languageRemap'>> & {
  providers?: Record<string, Partial<ProviderConfigItem>>;
  languageRemap?: Record<string, string>;
};
