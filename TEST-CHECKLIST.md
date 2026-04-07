# Test Checklist — openclaw-poe-provider

## Unit Tests (mocked, no API key needed) ✅

### Client (`tests/client.test.ts`) — 12 tests
- [x] Sends correct Authorization header
- [x] Sends non-streaming request by default
- [x] Uses correct base URL (api.poe.com/v1)
- [x] Supports custom base URL
- [x] Calls /v1/models for listModels
- [x] PoeApiError.userMessage for 401 (invalid key)
- [x] PoeApiError.userMessage for 402 (insufficient points)
- [x] PoeApiError.userMessage for 429 (rate limit)
- [x] PoeApiError.userMessage for 500+ (server error)
- [x] PoeApiError.userMessage for generic errors
- [x] Retries on 429 with backoff
- [x] Does NOT retry on 400

### Media Extractor (`tests/adapters/media-extractor.test.ts`) — 21 tests
- [x] Extracts image from standard Poe response (markdown + raw URL)
- [x] Handles multiple images in one response
- [x] Handles image URL without markdown wrapper
- [x] Returns empty for non-image content
- [x] Deduplicates markdown + raw URLs
- [x] Falls back to common image extensions
- [x] Extracts audio URL from TTS response
- [x] Returns null for non-audio content
- [x] Extracts audio URL mixed with other text
- [x] Falls back to common audio extensions
- [x] Extracts video URL from video bot response
- [x] Returns null for non-video content
- [x] Falls back to common video extensions
- [x] Extracts music URL and description
- [x] Strips 'Caption:' prefix from description
- [x] Handles audio-only response (no description)
- [x] Returns null for non-audio content (music)
- [x] hasMediaContent detects image CDN URLs
- [x] hasMediaContent detects audio CDN URLs
- [x] hasMediaContent detects video CDN URLs
- [x] hasMediaContent returns false for plain text

### Param Mapper (`tests/adapters/param-mapper.test.ts`) — 17 tests
- [x] buildImagePrompt: base prompt only
- [x] buildImagePrompt: adds aspect ratio
- [x] buildImagePrompt: adds size
- [x] buildImagePrompt: adds count when > 1
- [x] buildImagePrompt: does not add count when 1
- [x] buildImagePrompt: combines all options
- [x] buildVideoPrompt: base prompt only
- [x] buildVideoPrompt: adds duration
- [x] buildVideoPrompt: adds aspect ratio and resolution
- [x] buildMusicPrompt: base prompt only
- [x] buildMusicPrompt: adds instrumental flag
- [x] buildMusicPrompt: adds duration
- [x] buildMusicPrompt: appends lyrics as separate section
- [x] validatePrompt: passes for valid prompts
- [x] validatePrompt: rejects empty prompts
- [x] validatePrompt: rejects single-character prompts
- [x] validatePrompt: includes context in error message

### Registry (`tests/registry.test.ts`) — 8 tests
- [x] Creates with default catalog (40+ bots)
- [x] Filters by capability
- [x] Returns default bot for capability
- [x] Registers new bots
- [x] Unregisters bots
- [x] Filters by available models
- [x] Returns all capabilities
- [x] Handles empty registry gracefully

### Models (`tests/models.test.ts`) — 5 tests
- [x] Returns requested model if in registry
- [x] Strips poe/ prefix from requested model
- [x] Returns requested model even if not in registry (new bot)
- [x] Falls back to default when no model requested
- [x] Falls back to hardcoded default with empty registry

### Errors (`tests/errors.test.ts`) — 9 tests
- [x] emptyResponseError creates correct code
- [x] noMediaUrlError truncates long response
- [x] noMediaUrlError redacts long tokens
- [x] downloadError strips query params from URL
- [x] notConfiguredError includes setup instructions
- [x] wrapError passes through PoeApiError unchanged
- [x] wrapError wraps generic Error
- [x] wrapError wraps string errors
- [x] wrapError sanitizes API key-like content

### Text Provider (`tests/providers/text.test.ts`) — 8 tests
- [x] Has correct provider id
- [x] Has correct label
- [x] Requires POE_API_KEY
- [x] Returns null catalog when no key
- [x] Returns catalog with models when key present
- [x] Resolves dynamic models
- [x] Includes vision-capable models
- [x] Includes reasoning models

### Image Provider (`tests/providers/image.test.ts`) — 7 tests
- [x] Has correct provider id and label
- [x] Reports configured when key exists
- [x] Reports not configured when key is empty
- [x] Has image models from registry
- [x] Generates image from Poe API response
- [x] Throws on empty response
- [x] Throws when no image URL in response

### Video Provider (`tests/providers/video.test.ts`) — 4 tests
- [x] Has correct provider id and label
- [x] Has video models from registry
- [x] Generates video from Poe API response
- [x] Throws on empty response

### Speech Provider (`tests/providers/speech.test.ts`) — 4 tests
- [x] Has correct provider id and label
- [x] Synthesizes speech from TTS bot response
- [x] Detects opus format
- [x] Throws on empty response

### Music Provider (`tests/providers/music.test.ts`) — 5 tests
- [x] Has correct provider id and label
- [x] Has music models from registry
- [x] Generates music from Poe API response
- [x] Passes instrumental flag in prompt
- [x] Throws on empty response

### Plugin Entry (`tests/index.test.ts`) — 6 tests
- [x] Has correct plugin metadata
- [x] Registers text provider even without API key
- [x] Registers all providers when API key is set
- [x] Gracefully handles missing registerMusicGenerationProvider
- [x] Registered text provider has correct id
- [x] Registered image provider has correct id

## Live E2E Tests (`tests/live/smoke.test.ts`) — 4 tests ✅
- [x] Lists models from /v1/models (363+ models)
- [x] Generates a text completion (GPT-4o-Mini)
- [x] Generates an image (dall-e-3) — URL + buffer download
- [x] Synthesizes speech (elevenlabs-v2.5-turbo) — audio buffer

## Code Quality Checks ✅
- [x] TypeScript compiles with zero errors (`tsc --noEmit`)
- [x] Build produces valid dist/ output (`tsc`)
- [x] 94.5% statement coverage
- [x] All 106 unit tests passing
- [x] All 4 live tests passing
- [x] No API keys in error messages (sanitization verified)
- [x] Retry logic tested (429 retries, 400 does not)

## Architecture Review ✅
- [x] Clean separation: client → adapters → providers → entry point
- [x] Declarative bot registry (add bots via config, not code)
- [x] Centralized error handling with user-facing messages
- [x] Param mapper separated from media extractor (Staff Eng feedback)
- [x] Plugin entry handles missing music API gracefully
- [x] TTL-cached model discovery with hardcoded fallback
- [x] Privacy notice in README (Security feedback)
- [x] Cost transparency in README (Normal User feedback)

## Summary
| Category | Count | Status |
|----------|-------|--------|
| Unit tests | 106 | ✅ All passing |
| Live tests | 4 | ✅ All passing |
| Coverage | 94.5% | ✅ |
| TypeScript | 0 errors | ✅ |
| Build | Clean | ✅ |
