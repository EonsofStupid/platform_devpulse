# sys/streams/

Subscription boundary for async data flows.

## Purpose

Per FOUNDATION.md section 4.3:
- Subscription contracts
- Observers
- Long-lived async pipelines
- WebSocket/SSE stream implementations

## Usage

```typescript
import { createWebSocketStream } from '$lib/sys/streams/websocket.stream.js';

const stream = createWebSocketStream({
  id: 'maestro-events',
  source: 'ws://localhost:8080/events',
});

const sub = stream.subscribe((msg) => {
  console.log('Received:', msg);
});

// Later
sub.unsubscribe();
```

## Rules

1. All subscription logic MUST live here
2. Domains may NOT create their own streams
3. Register all streams in streamsRegistry
