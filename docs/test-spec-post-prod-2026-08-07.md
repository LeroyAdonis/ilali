# Test Spec — Post-Production Unit Tests (2026-08-07)

Covers everything shipped this session:
- WS-5 parent wins (`e316c7c`): WhatsAppButton, ReviewSection, ComingSoon, similar providers on club page
- AI model fix (`c17f6d1` + `f66e869`): gpt-oss-120b as primary, pool order, 15s timeout

Env: vitest, node environment (NO jsdom/RTL — do not add deps). Component rendering stays covered by Playwright E2E (clubs.spec.ts already asserts the WS-5 UI). Unit tests target pure logic.

---

## 1. `src/lib/__tests__/ai-client.test.ts` — extend existing suite

### 1.1 getAIConfig default (NEW)
- `getAIConfig().model` === `"openai/gpt-oss-120b"` (bake-off winner)
- `getAIConfig().provider` === `"nvidia"`
- `getAIConfig().baseUrl` contains `integrate.api.nvidia.com`

### 1.2 Pool order (NEW — strengthen existing "exports a pool" test)
Assert the exact rotation order (winner first):
`NIM_MODEL_POOL[0]` = `"openai/gpt-oss-120b"`
`NIM_MODEL_POOL[1]` = `"nvidia/nemotron-3-super-120b-a12b"`
`NIM_MODEL_POOL[2]` = `"meta/llama-3.3-70b-instruct"`
`NIM_MODEL_POOL[3]` = `"mistralai/mistral-nemotron"`
- length >= 4
- no DeepSeek anywhere (already exists — keep)

### 1.3 Rotation on timeout (NEW)
Simulate `fetch` that rejects with `DOMException('AbortError')` → `chat()` rotates to next model (assert 2 fetch calls, second returns ok). Guards the 15s timeout path.

---

## 2. `src/lib/ai/__tests__/match-extract.test.ts` — NEW file (match.ts has zero tests)

`extractIntent(query)` is the front door of `/api/match` — the thing that was permanently falling back. Test it end-to-end with `chat` mocked via `vi.mock("@/lib/ai/client")`.

### 2.1 Returns null when chat fails (NEW)
- Mock `chat` → `null` → `extractIntent("tennis")` === `null`

### 2.2 Parses clean JSON (NEW)
- Mock `chat` → `{"ageMin":9,"ageMax":9,"tags":["sport"],"location":"Claremont","priceMax":null}`
- Result: `{ageMin:9, ageMax:9, tags:["sport"], location:"Claremont", priceMax:undefined}`

### 2.3 Strips ```json fences (NEW)
- Mock `chat` → ``` ```json\n{"ageMin":8,"tags":["sport"],"location":null,"priceMax":null}\n``` ```
- Parses to ageMin 8, tags ["sport"]

### 2.4 Filters invalid tags (NEW)
- Mock `chat` → `{"tags":["sport","not-a-real-tag","music","nonsense"]}`
- Result tags === `["sport","music"]` (only MATCH_TAGS allowed), max 5

### 2.5 Handles garbage JSON (NEW)
- Mock `chat` → `"not json at all"` → `extractIntent` === `null` (no throw)

### 2.6 Uses the 15s timeout (NEW — guards the f66e869 fix)
- Mock `chat` → valid JSON
- Assert `chat` was called with `timeoutMs: 15000`

---

## 3. WhatsApp URL construction (NEW — no jsdom needed)

### 3.1 Refactor `src/components/WhatsAppButton.tsx` (MINIMAL)
Export a pure helper from the same file (keep component unchanged):
```ts
export function buildWhatsAppUrl(phone: string, activityName: string, override?: string): string {
  const contactNumber = override ?? phone;
  const message = encodeURIComponent(
    `Hi! I found your "${activityName}" listing on ILALI and I'm interested in learning more.`
  );
  return `https://wa.me/${contactNumber}?text=${message}`;
}
```
Component calls `buildWhatsAppUrl(phone, activityName, process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER)`.

### 3.2 `src/lib/__tests__/whatsapp.test.ts` (NEW)
- URL starts with `https://wa.me/+27731234567?text=`
- message is URL-encoded (`encodeURIComponent` applied — assert `%22` for quotes, `%20` for spaces, no raw spaces)
- override param wins when provided
- without override, phone is used

---

## 4. NOT in scope (already covered / needs E2E)
- Club page JSX rendering (ReviewSection/ComingSoon/ProviderCard grid) → Playwright clubs.spec.ts covers
- getSimilarProviders tag-overlap + excludes self → data-source.test.ts line 93 covers
- Reviews API → covered by existing API tests/E2E
- Do NOT add jsdom/@testing-library deps

---

## Verification
- `npx tsc --noEmit` clean
- `npx vitest run` — all existing 153 + new tests pass
- New counts: ~10-12 new test cases across 3 files
- `npx eslint` on changed files — no NEW errors (pre-existing Date.now() warning in club page is baseline)
