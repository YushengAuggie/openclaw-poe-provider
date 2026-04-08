# @auggie/openclaw-poe-provider

**One API key. Five AI capabilities.**

An OpenClaw provider plugin that uses a single [Poe API](https://poe.com/api_key) key to provide:

- 🧠 **Text/LLM** — Claude, GPT, Gemini, Kimi, and hundreds more
- 🎨 **Image Generation** — Imagen 4, GPT Image, Flux, DALL-E, Seedream
- 🎬 **Video Generation** — Veo 3, Runway Gen 4, Kling, Seedance
- 🗣️ **Speech/TTS** — ElevenLabs, Gemini TTS, GPT Audio, Orpheus
- 🎵 **Music Generation** — Lyria 3, Stable Audio, ElevenLabs Music
- 🔍 **Web Search** — GPT-5.4, Claude Sonnet, Gemini Flash (via Responses API)

Replace 5+ separate API keys with one `POE_API_KEY`.

## Quick Start (30 seconds)

```bash
# 1. Install the plugin
openclaw plugin install @auggie/openclaw-poe-provider

# 2. Set your API key
export POE_API_KEY=your-key-here   # Get one at poe.com/api_key

# 3. Restart OpenClaw
openclaw gateway restart
```

That's it. OpenClaw will now use Poe for text, image, video, TTS, music, and web search.

## Compute Point Costs

Poe uses **compute points** instead of per-token pricing. Your subscription tier determines your monthly point budget.

| Capability | Example Bot | Approx. Points/Request | Notes |
|---|---|---|---|
| Text (small) | GPT-4o-Mini | ~20–50 | Per message |
| Text (large) | Claude Opus 4 | ~500–2000 | Per message, depends on length |
| Image | Imagen 4 | ~100–300 | Per image |
| Image (premium) | GPT Image 1 | ~300–800 | Per image |
| Video | Veo 3 | ~1000–5000 | Per video (30s generation time) |
| TTS | ElevenLabs | ~50–200 | Per synthesis |
| Music | Lyria 3 | ~200–500 | Per track |
| Search | GPT-5.4 | ~50–200 | Per query (via Responses API) |

**Poe Subscription Tiers:**
| Plan | Price | Points/Month |
|---|---|---|
| Free | $0 | 1,000 |
| Poe+ | $4.99/mo | 100,000 |
| Poe Premium | $16.99/mo | 1,000,000 |
| Poe Business | $49.99/mo | 5,000,000 |

> **Tip:** Start with a lower-cost bot (e.g., `imagen-4-fast` instead of `gpt-image-1`) to conserve points. Use the premium bots when quality matters.

Check your remaining points at [poe.com/settings/billing](https://poe.com/settings/billing).

## Available Models

### Image Generation
| Model ID | Name | Notes |
|---|---|---|
| `imagen-4` | Imagen 4 | **Default.** Google's latest |
| `imagen-4-fast` | Imagen 4 Fast | Lower cost |
| `gpt-image-1` | GPT Image 1 | OpenAI |
| `flux-kontext-max` | Flux Kontext Max | Black Forest Labs |
| `dall-e-3` | DALL-E 3 | OpenAI classic |
| `seedream-5.0-lite` | Seedream 5.0 Lite | ByteDance |
| + 12 more | | See registry.ts |

### Video Generation
| Model ID | Name | Notes |
|---|---|---|
| `veo-3` | Veo 3 | **Default.** Google DeepMind |
| `veo-3.1` | Veo 3.1 | Latest |
| `runway-gen-4-turbo` | Runway Gen 4 Turbo | Runway |
| `kling-v3-pro` | Kling V3 Pro | Kuaishou |
| + 8 more | | See registry.ts |

### Speech/TTS
| Model ID | Name | Notes |
|---|---|---|
| `elevenlabs-v3` | ElevenLabs V3 | **Default** |
| `gemini-2.5-flash-tts` | Gemini Flash TTS | Google |
| `gpt-audio` | GPT Audio | OpenAI |
| + 4 more | | See registry.ts |

### Music Generation
| Model ID | Name | Notes |
|---|---|---|
| `lyria-3` | Lyria 3 | **Default.** Google DeepMind |
| `elevenlabs-music` | ElevenLabs Music | ElevenLabs |
| `stable-audio-2.5` | Stable Audio 2.5 | Stability AI |

### Web Search
| Model ID | Name | Notes |
|---|---|---|
| `GPT-5.4` | GPT-5.4 Search | **Default.** Uses Responses API |
| `GPT-5.2` | GPT-5.2 Search | OpenAI |
| `Claude-Sonnet-4.6` | Claude Sonnet Search | Anthropic |
| `Gemini-3-Flash` | Gemini Flash Search | Google |

## Usage with OpenClaw

Once installed, the plugin integrates seamlessly:

```bash
# Use Poe text models
openclaw model set poe/claude-opus-4-6

# Generate images (via /imagine or image_generate tool)
# Generates with poe/imagen-4 by default

# Generate video
# Uses poe/veo-3 by default

# TTS — automatically uses Poe when configured
# Music generation — automatically uses Poe when configured

# Web search — uses Poe's Responses API with web_search_preview tool
```

## ⚠️ Privacy Notice

**All API requests route through Poe (operated by Quora, Inc.).** This includes:

- Text prompts and conversations
- Image/video generation prompts
- TTS text input
- Any context included in API calls

**What this means:**
- Your data is subject to [Poe's Terms of Service](https://poe.com/tos) and [Privacy Policy](https://poe.com/privacy)
- Poe may process requests through third-party model providers (OpenAI, Google, Anthropic, etc.)
- Do not send highly sensitive data (credentials, medical records, legal documents) through this provider without reviewing Poe's data handling policies

**What this plugin does NOT do:**
- Does not log your API key
- Does not send data to any endpoint other than `api.poe.com`
- Does not store or cache your prompts or responses locally

## Error Messages

The plugin provides clear, actionable error messages:

| Error | What It Means | What To Do |
|---|---|---|
| "Invalid Poe API key" | Your `POE_API_KEY` is wrong or expired | Get a new key at poe.com/api_key |
| "Compute points exhausted" | Monthly points used up | Top up at poe.com/settings/billing |
| "Rate limit reached" | Too many requests per minute | Wait a moment and retry |
| "API temporarily unavailable" | Poe servers are down | Wait and retry; check status.poe.com |

## Architecture

```
src/
├── index.ts              # Plugin entry — registers all capabilities
├── client.ts             # Shared Poe API client (retry, backoff, timeout)
├── errors.ts             # Centralized error handling with user-facing messages
├── registry.ts           # Declarative bot registry (add bots via config)
├── models.ts             # Model catalog + /v1/models TTL cache
├── types.ts              # OpenClaw plugin SDK type stubs
├── adapters/
│   ├── media-extractor.ts  # Parse media URLs from bot responses
│   ├── param-mapper.ts     # Map OpenClaw params → Poe prompt format
│   └── search-adapter.ts   # Parse Responses API output → search results
└── providers/
    ├── text.ts           # Text/LLM provider
    ├── image.ts          # Image generation
    ├── video.ts          # Video generation
    ├── speech.ts         # TTS/speech synthesis
    ├── music.ts          # Music generation
    └── search.ts         # Web search (Responses API)
```

## Development

```bash
# Install dependencies
npm install

# Run tests (no API key needed — all mocked)
npm test

# Run tests in watch mode
npm run test:watch

# Run live smoke tests (consumes compute points!)
TEST_POE_LIVE=1 POE_API_KEY=your-key npm run test:live

# Type check
npm run lint

# Build
npm run build
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Add tests for any new functionality
4. Run `npm test` and ensure all tests pass
5. Submit a PR

**Adding a new bot:** Edit `src/registry.ts` — just add a new entry to the `DEFAULT_BOTS` array. No other code changes needed.

## License

MIT
