# Endpoint execution restoration

Reviewed 2026-11-02 against the original source, the active Tauri consumers,
and the protocol references below. This is a reconciled implementation of one
historical adapter, not completion of the AI restoration or plan 0009 R3b.

## Source and ownership

Historical source: `alpha/orchestrator/src/adapters/web/openai.rs` at
`1577166f3e9970043aeaa68b187e96eb19eca451`, deleted by `519da880`.
Its preserved body at `recovered/repo/alpha/orchestrator/src/adapters/web/openai.rs`
matches the original Git blob byte for byte. SHA-256:
`8282118b068a131bdd1b4e67f304d3ba4d6c6e4149deffd1fa4b6137becde055`.
The preserved file is retained so the reconciliation remains independently
reviewable. `recovered/repo/SOURCES.tsv` records the active destination and hash.

The primary destination is
`kernel/devpulse-clyffy/src/providers/adapters/openai_compatible/chat.rs`.
Its colocated `types.rs`, `http.rs`, `sse.rs` and `operation_tests.rs` separate
contracts, bounded transport, stream framing and verification. The existing
provider registry and `providers/connections` own provider identity, saved
configuration, private credentials and operation evidence. No replacement
provider registry or legacy adapter facade was introduced.

The second source comparison is the active `llama_chat` / `llama_embed` code
in `interfaces/desktop/src-tauri/src/commands/llama/mod.rs` at baseline
`97d735f8c2eb6b2ca929ac2d61ae68250564fc45`. Its AI HTTP and parsing logic now
uses the same kernel transport through the engine's `ai_providers` facade.
Tauri still reads the supervised process port and delivers typed events.
This does not claim that all existing process lifecycle code has moved to the
engine. A managed loopback address is derived from that actual port; saved
connections use the exact configured API base, including custom version paths.

## Behavior comparison

| Original behavior | Active implementation and deliberate correction |
| --- | --- |
| `new`, `with_client`, `openai`, `lmstudio` constructed an adapter from endpoint, key and model | Saved connection identity plus an explicit operation request supplies those values. One kernel HTTP client owns connection reuse, a five-second connect deadline and a 120-second total request deadline. The old arbitrary client injection and per-adapter timeout option are not exposed by the new UI. |
| `provider`, `name`, `adapter_kind` identified a web provider | The existing typed provider registry owns identity, display names, protocol and capability declarations. No duplicate string-based identity or compatibility type remains. |
| `is_ready` was true merely from a key's presence or a local provider enum | Credentials and saved configuration do not establish readiness. Discovery and text execution have separate, timestamped evidence. Failed text retries replace the preceding answer. Editing/removing a connection invalidates evidence; restart retains configuration only. |
| `check_availability` accepted any HTTP response | Existing model discovery checks the configured endpoint and validates its response. A discovered model alone does not prove text generation or a functioning agent workflow. |
| `infer` sent optional system instructions and a user message with model, temperature and output limit | Typed ordered messages retain this behavior and support prior assistant messages. Optional top-p and stop sequences from the historical shared parameter contract are now serialized. Invalid parameters fail before HTTP. Hosted OpenAI tests use `max_completion_tokens`; compatible local protocols use `max_tokens`. |
| Missing content became an empty successful answer; missing usage became zero | Missing/empty text, refusals and unsupported finish reasons fail. Usage and reported model remain optional. Timing includes complete body consumption. A `length` result remains explicitly distinguished from `stop` in the typed result. |
| `infer_stream` called non-streaming `infer` and delivered the entire response once | Real SSE deltas are delivered as they arrive. Byte framing preserves fragmented UTF-8, handles CR/LF/CRLF, BOM, comments and multiline data. Malformed frames, tool calls, refusals and premature EOF fail. Successful completion requires a valid finish reason and `[DONE]`. |
| Error responses included the server's entire body | Errors report a safe status or static parsing/transport failure. Server bodies, malformed fields and credential-bearing request details are not echoed into public errors. Redirects are refused. Bodies, stream frames and total stream traffic are bounded. |
| Tauri streamed lossy per-chunk strings, skipped malformed events and accepted EOF | It delegates to the kernel decoder; transport and protocol decisions have one owner. Dropping the operation or returning a callback error releases the HTTP response. |
| Tauri embeddings ignored HTTP status and silently removed invalid vector entries | Kernel embedding requests validate status, one indexed row, a nonempty vector and every finite numeric component. |
| The model sidecar route emitted `llama:token` while its screen listened for `inference-token` | `inference_generate` now emits `InferenceTokenStreamed` for both model routes. The separate `llama_chat` command retains its own existing event contract. No dual-emission compatibility path was added. |

## Reviewable desktop workflow

Settings / first-run **Your AI** lists saved endpoint connections. After an
explicit model-list check, supported connections offer a model selector and
**Try model**. The exact question and possible provider charge are displayed
before the user acts. Clicking sends that question to the saved API base with
only that connection's private credential. The actual answer, requested model,
question and time appear separately from model-list evidence. Answers render
as text, never HTML. No request is sent merely by rendering or selecting a model.

The engine supplies product copy and serializes operations; Tauri only bridges
the command. Typed, revision-checked provider signals own the displayed state.
The colocated providers-domain UI uses existing ColdLight components and
generated styling. There is no new design-system primitive or standalone CSS.

Only registry entries declaring chat and the implemented OpenAI-compatible
protocol expose the test. Native Anthropic/Gemini protocols and subscription
programs are not silently sent through a guessed HTTP protocol. Vendor-owned
subscription sign-in is unchanged. This operation is text-only and does not
establish tool execution, Council, AgentHub or remote Clyffy readiness.

## Evidence and remaining work

Tests exercise real loopback HTTP requests with fake credentials: exact custom
paths and request bodies, system instructions and generation parameters,
Unicode stream fragmentation, terminal events, malformed and refused replies,
credential-safe errors, strict embeddings, saved connection key isolation,
failed retries and edit invalidation. Browser tests cover explicit model choice,
unsupported protocols and literal answer rendering. These are controlled
fixtures, not claims of testing a live account or a running desktop session.

Final checks: 145 provider tests passed, three live-account tests ignored;
nine Chromium UI/store tests, five copy/configuration tests and five signal
contract tests passed. Desktop typecheck reports no errors or warnings, and
workspace Clippy is clean. All twenty architecture assertions pass across the
suite and the isolated route rerun. The pre-existing route source guard timed
out in serial filesystem reads; directory-entry traversal and bounded concurrent
reads preserve all 737 files and the same predicate. Its seven-test file now
completes in 121 ms without changing the five-second timeout. Route dependency
loading remains slow and is not claimed fixed by that scan improvement.

The parent historical `adapters/mod.rs` and `adapters/web/mod.rs` are comparison
material; their entire contents are not marked restored by this change. The
historical `web/mod.rs` references a manager file absent at that recovered path;
its implementation must be located in history before any completeness claim.

Remaining work includes routing actual Chat/Council sessions by saved connection
identity, model-slot binding, native vendor execution protocols, remote Clyffy
activation and subprocess packaging, and AgentHub's prefixed ticket/state tables
and worker execution. Council stays in Chat; AgentHub remains the AI ticket
factory under Overmind. The wider inventory remains in
`docs/restoration/ai-inventory.md` and plan 0009. Its baseline inventory is not
rewritten to disguise staged files as functioning code.

## Protocol research

- [OpenAI chat completion request](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create): message structure, optional sampling controls and the hosted completion-token limit, including reasoning tokens.
- [OpenAI streaming events](https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events): indexed choices, text deltas, finish reasons and usage-only chunks.
- [OpenAI embedding request](https://developers.openai.com/api/reference/resources/embeddings/methods/create): float output format and indexed embedding rows.
- [OpenAI usage reporting](https://help.openai.com/en/articles/10478918-reviewing-api-usage-and-costs): optional streamed usage reporting. An absent usage report is left unknown; it is not synthesized from text.

These references inform protocol parsing. They do not establish that an arbitrary
configured endpoint implements every documented feature or that a subscription
grants API access.
