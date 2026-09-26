export interface StremioManifestResource {
  name: string;
  types: string[];
  idPrefixes?: string[];
}

export interface StremioManifestBehaviorHints {
  configurable?: boolean;
  configurationRequired?: boolean;
}

export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  background?: string;
  resources: (string | StremioManifestResource)[];
  types: string[];
  catalogs: unknown[];
  behaviorHints?: StremioManifestBehaviorHints;
}

export interface StremioSubtitle {
  id: string;
  url: string;
  lang: string;
  // Optional extra fields recognized by players (like Nuvio or Web, stremio-core PR #947)
  file?: string;
  title?: string;
  label?: string;
  description?: string;
}

export interface StremioSubtitlesResponse {
  subtitles: StremioSubtitle[];
}

export interface StremioSubtitleExtra {
  videoHash?: string;
  videoSize?: string;
  filename?: string;
  [key: string]: string | undefined;
}
