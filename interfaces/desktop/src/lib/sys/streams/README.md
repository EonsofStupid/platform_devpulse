# sys/streams/

Subscription boundary for async data flows.

## Purpose

Per FOUNDATION.md section 4.3:
- Subscription contracts
- Observers
- Long-lived async pipelines
- WebSocket/SSE stream implementations

## Usage

Typed engine signals go through the signal fabric (`#lib/sys/events/signal-fabric.js`).
A Tauri event with no signal yet goes through `createTauriEvent` here:

```typescript
import { createTauriEvent } from '#lib/sys/streams/tauri-event.svelte.js';

const loading = createTauriEvent<{ slot_id: string }>('model:loading-started');

// The teardown is the subscription handle: return it from $effect.
$effect(() => loading.handle((payload) => { /* react */ }));
```

## Rules

1. All subscription logic MUST live here
2. Domains may NOT create their own streams
3. Register all streams in streamsRegistry

Both boundaries register what they carry, so `streamsRegistry`
(`#lib/sys/registries/streams/streams.registry.js`) lists the window's live
subscriptions; System > Observability > Structure shows them.
`tests/architecture/stream-boundary.test.ts` holds rules 1 and 2. It names the
files that still call `listen()` themselves, and that list can only shrink.
