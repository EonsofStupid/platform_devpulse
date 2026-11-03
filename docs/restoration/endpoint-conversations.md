# Saved endpoint conversations

Reviewed 2026-11-02 against retained source and the active Chat implementation
at `7c3e056f0d903403b0e29b862e997d0ff5c6fa4f`. This batch connects the restored
HTTP transport to actual conversations. It does not complete plan 0009 R3b
or claim that all historical AI code has been restored.

## Source comparison and preservation

Both sources below come from `1577166f3e9970043aeaa68b187e96eb19eca451`, before
deletion by `519da880`. Their retained bodies were compared byte for byte with
Git during this batch and match. The source manifest rows remain staged:
neither complete module has been reconciled, so neither is counted as promoted.

| Retained original | SHA-256 |
| --- | --- |
| `recovered/repo/alpha/orchestrator/src/chat/mod.rs` | `cc0efd1b30dadf1485e2f5ca8bc8fc478e73ec82114ccb1fcf2eef3860e191ab` |
| `recovered/repo/alpha/engine/src/facade/chat.rs` | `8ab850e1727b89135598b0d9e825ba56e3971aeb4e09f25622066ee8e1460fbc` |

The orchestrator's `ChatEngine` persisted turns but used a fixed session,
loaded a particular local model and did not feed earlier turns into inference.
Its optional CAG path and analytics were separate behavior; its unavailable-model
path could produce fabricated assistant responses. The facade accepted a session
identifier for events but delegated to the singleton, estimated token counts and
left history/clear as stubs. Those are source facts, not behavior to reproduce.

The active Tauri `send_message` selected the most recently updated session in a
project, regardless of the sidebar selection. Its history reader selected the
first 200 turns. The frontend sent only the latest prompt to local inference,
counted streamed chunks as tokens and appended late responses to whichever
conversation was then visible.

## Owning code and corrections

- `kernel/devpulse-clyffy/src/providers/connections/execution.rs` prepares an
  explicit saved connection revision, model and private credential snapshot.
  It validates ordered text context and invokes the restored protocol transport.
  Connection edits increment a persisted revision; stale bindings fail before
  saving or sending a new user turn. In-flight requests retain their already
  approved snapshot. No request chooses a default endpoint or model.
- `systems/devpulse-engine/src/platform/chat/` owns scoped conversation reads,
  ordinary writes, endpoint turns, concurrency and cancellation. It reuses the
  existing `sessions`, `turns` and atomic turn writer. The new
  `chat_endpoint_sessions` table binds a session to its connection revision,
  retained label and chosen model. Connection removal does not delete history.
  The shared writer now rejects archived sessions within its transaction.
  History and ordinary Chat remain available when the saved-connection service
  cannot initialize; endpoint requests then fail explicitly.
- `interfaces/desktop/src-tauri/src/commands/chat/` delegates the affected
  commands to the engine. Endpoint deltas use a Tauri channel for each request;
  this path does not broadcast text across unrelated windows.
- `interfaces/desktop/src/lib/domains/chat/` composes existing ColdLight Select,
  Button and Text components with colocated picker props and tests. No new
  primitive, runtime styling engine or copied card implementation is needed.
  The current generated ColdLight styling remains the source of component styles.
  Saved endpoint/model choice is explicit; rendering or starting a conversation
  does not send a prompt. The UI explains where conversation text is sent.
  Stop cancels the identified endpoint request. Errors remain visible alongside
  retained messages. Sessions are displayed for the active project.

Ordinary Chat now passes its selected session, with `None` meaning a new
conversation. Empty input cannot create an empty ordinary session. Assistant
writes use the session returned for their user turn, even if the person changes
views while inference runs. Unknown token usage remains null. The unused
frontend store-only method was removed after verifying it had no callers;
its underlying command is the same scoped writer used by ordinary inference.

Endpoint prompts include all stored turns in order, across application restarts.
The display reads the latest 200 in chronological order; this display limit does
not truncate model context. Input beyond 2,000 messages or 1 MiB is refused
explicitly, not silently shortened. These are transport bounds, not a guarantee
that a particular model's token window will fit. Provider failures remain errors.
Generation currently uses a 1,024-token output limit for compatible servers and
4,096 completion tokens for hosted OpenAI, with no temperature override.

One endpoint response may run per conversation. Cancellation and shutdown drop
the HTTP stream and release the running slot. A saved user turn remains after a
failed/cancelled request; partial output is never a completed assistant turn.
Cancellation observed before the final commit prevents it; cancellation after
that commit has begun cannot undo an already completed answer. A missing or
archived session cannot accept the final write. The original source and all
existing transcripts remain preserved.

## Verification and operator path

Real loopback HTTP and user-store tests cover explicit model/path selection,
ordered second-turn context after reopening the database, changed/removed
connections, project scope, overlapping requests, exact-request cancellation,
shutdown, archive protection, recent-history ordering and database upgrades.
Kernel tests cover revision/credential validation and context bounds. Browser
tests exercise explicit picker intent, failed routing, ordinary session ownership,
unknown usage, late endpoint events and cancellation dispatch.

In the Tauri app: open a project, open **Your AI**, save the desired endpoint,
and use **Check models**. In Chat, select that named connection and a returned
model, then **Start chat**. Send a message and a follow-up referring to the first
answer. Stop is available while an endpoint response runs. Reopening the app
retains the transcript and binding; editing the connection requires a new chat.
Live provider accounts and a packaged desktop release have not been exercised by
these loopback/browser tests.

## Remaining work

- Reconcile the historical CAG/context selection, memory, analytics and role
  behavior against their existing kernel/engine owners before promoting either
  whole historical Chat module. Keep original documents and code until verified.
- Ordinary local-slot inference still uses its existing global token event and
  latest-prompt generation. Its writes and view ownership are corrected here;
  full ordered context and request-scoped native local streaming remain work.
- Endpoint text is not the remote Clyffy control plane or an agent tool protocol.
  Subscription sessions continue through their vendor-owned adapters; no API-key
  or endpoint substitution represents Codex subscription activation.
- Complete Council roles/configuration in Chat and AgentHub's independent ticket
  workflow under Overmind, including service schema agreement, worker sharing,
  supervision, notifications and bundled subprocess lifecycle. Existing
  `agenthub_threads`/`agenthub_room_threads` conversation ownership still needs
  reconciliation with the intended database prefixes; this batch adds no endpoint
  chat records to those tables.
- Conversation list/export/deletion still have existing Tauri persistence code.
  Endpoint streaming is request-local and is not yet a cross-window live replay
  service. Advanced generation settings, model context budgets, archived-chat
  continuation and failed-turn retry policy need their own explicit UI behavior.
