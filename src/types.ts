/**
 * OpenClaw Plugin SDK type stubs.
 *
 * These interfaces match the OpenClaw plugin SDK contracts so this plugin
 * compiles standalone. At runtime, OpenClaw injects the real implementations.
 */

// ── Provider Types ──────────────────────────────────────────────────────────

export interface PluginEntry {
  id: string;
  name: string;
  description: string;
  register(api: PluginApi): void;
}

export interface PluginApi {
  registerProvider(provider: ProviderRegistration): void;
  registerImageGenerationProvider(provider: ImageGenerationProvider): void;
  registerVideoGenerationProvider(provider: VideoGenerationProvider): void;
  registerSpeechProvider(provider: SpeechProvider): void;
  registerMusicGenerationProvider?(provider: MusicGenerationProvider): void;
  registerWebSearchProvider?(provider: WebSearchProvider): void;
}

export interface ProviderAuthMethod {
  methodId: string;
  label: string;
  hint: string;
  envVar: string;
  run?(ctx: AuthRunContext): Promise<void>;
  runNonInteractive?(ctx: AuthRunContext): Promise<void>;
}

export interface AuthRunContext {
  resolveProviderApiKey(providerId: string): { apiKey: string | undefined };
}

export interface ProviderRegistration {
  id: string;
  label: string;
  docsPath?: string;
  envVars: string[];
  auth: ProviderAuthMethod[];
  catalog: ProviderCatalog;
  resolveDynamicModel?(ctx: DynamicModelContext): ResolvedModel | null;
}

export interface ProviderCatalog {
  order: "simple" | "profile" | "paired" | "late";
  run(ctx: CatalogContext): Promise<CatalogResult | null>;
}

export interface CatalogContext {
  resolveProviderApiKey(providerId: string): { apiKey: string | undefined };
}

export interface CatalogResult {
  provider: ProviderConfig;
}

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  api: string;
  models: ModelDefinition[];
}

export interface ModelDefinition {
  id: string;
  name: string;
  reasoning?: boolean;
  input?: string[];
  cost?: ModelCost;
  contextWindow?: number;
  maxTokens?: number;
}

export interface ModelCost {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface DynamicModelContext {
  modelId: string;
}

export interface ResolvedModel {
  id: string;
  name: string;
  provider: string;
  api: string;
  baseUrl: string;
  reasoning: boolean;
  input: string[];
  cost: ModelCost;
  contextWindow: number;
  maxTokens: number;
}

// ── Image Generation ────────────────────────────────────────────────────────

export interface ImageGenerationProvider {
  id: string;
  label: string;
  defaultModel?: string;
  models?: ImageModel[];
  isConfigured(ctx: ConfigCheckContext): boolean;
  generate(req: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

export interface ImageModel {
  id: string;
  name: string;
  supportsEdit?: boolean;
}

export interface ConfigCheckContext {
  config?: Record<string, unknown>;
  env?: Record<string, string | undefined>;
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  image?: string;
  images?: string[];
  size?: string;
  aspectRatio?: string;
  count?: number;
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
}

export interface GeneratedImage {
  url?: string;
  buffer?: Buffer;
  mimeType?: string;
  revisedPrompt?: string;
}

// ── Video Generation ────────────────────────────────────────────────────────

export interface VideoGenerationProvider {
  id: string;
  label: string;
  defaultModel?: string;
  models?: VideoModel[];
  capabilities?: VideoCapabilities;
  isConfigured(ctx: ConfigCheckContext): boolean;
  generateVideo(req: VideoGenerationRequest): Promise<VideoGenerationResult>;
}

export interface VideoModel {
  id: string;
  name: string;
}

export interface VideoCapabilities {
  maxImages?: number;
  maxVideos?: number;
  maxDurationSeconds?: number;
  supportsResolution?: boolean;
  supportsAspectRatio?: boolean;
  supportsAudio?: boolean;
}

export interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  image?: string;
  images?: string[];
  video?: string;
  aspectRatio?: string;
  resolution?: string;
  durationSeconds?: number;
  audio?: boolean;
}

export interface VideoGenerationResult {
  videos: GeneratedVideo[];
}

export interface GeneratedVideo {
  url?: string;
  buffer?: Buffer;
  mimeType?: string;
  durationSeconds?: number;
}

// ── Speech/TTS ──────────────────────────────────────────────────────────────

export interface SpeechProvider {
  id: string;
  label: string;
  isConfigured(ctx: ConfigCheckContext): boolean;
  synthesize(req: SpeechSynthesisRequest): Promise<SpeechSynthesisResult>;
}

export interface SpeechSynthesisRequest {
  text: string;
  voice?: string;
  model?: string;
  speed?: number;
}

export interface SpeechSynthesisResult {
  audioBuffer: Buffer;
  outputFormat: string;
  fileExtension: string;
  voiceCompatible: boolean;
}

// ── Music Generation ────────────────────────────────────────────────────────

export interface MusicGenerationProvider {
  id: string;
  label: string;
  defaultModel?: string;
  models?: MusicModel[];
  isConfigured(ctx: ConfigCheckContext): boolean;
  generate(req: MusicGenerationRequest): Promise<MusicGenerationResult>;
}

export interface MusicModel {
  id: string;
  name: string;
}

export interface MusicGenerationRequest {
  prompt: string;
  model?: string;
  lyrics?: string;
  instrumental?: boolean;
  durationSeconds?: number;
  format?: string;
}

export interface MusicGenerationResult {
  audio: GeneratedAudio;
  description?: string;
}

export interface GeneratedAudio {
  url?: string;
  buffer?: Buffer;
  mimeType?: string;
  durationSeconds?: number;
}

// ── Web Search ─────────────────────────────────────────────────────────────

export interface WebSearchProvider {
  id: string;
  label: string;
  isConfigured(ctx: ConfigCheckContext): boolean;
  search(req: WebSearchRequest): Promise<WebSearchResult>;
}

export interface WebSearchRequest {
  query: string;
  count?: number;
}

export interface WebSearchResult {
  content: string;
  citations?: Array<{ url: string; title?: string }>;
}

// ── Poe Responses API Types ────────────────────────────────────────────────

export interface PoeResponsesApiRequest {
  model: string;
  input: string;
  tools?: Array<{ type: string }>;
  reasoning?: { effort: string };
}

export interface PoeResponsesApiResponse {
  id: string;
  output: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      url?: string;
      title?: string;
    }>;
  }>;
  output_text?: string;
}

// ── Poe API Types ───────────────────────────────────────────────────────────

export interface PoeApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: PoeApiChoice[];
  usage: PoeApiUsage;
}

export interface PoeApiChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface PoeApiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface PoeModelsResponse {
  data: PoeModelEntry[];
}

export interface PoeModelEntry {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

// ── Bot Registry ────────────────────────────────────────────────────────────

export type BotCapability = "text" | "image" | "video" | "speech" | "music" | "search";

export interface BotRegistryEntry {
  /** Poe bot name (used as model ID in API calls) */
  botName: string;
  /** Human-readable display name */
  displayName: string;
  /** Which capability this bot provides */
  capability: BotCapability;
  /** Whether this is a default/recommended bot for its capability */
  isDefault?: boolean;
  /** Whether the bot supports reference image input */
  supportsImageInput?: boolean;
  /** Whether the bot supports reference video input */
  supportsVideoInput?: boolean;
  /** Additional parameters the bot accepts via extra_body */
  extraParams?: string[];
}
