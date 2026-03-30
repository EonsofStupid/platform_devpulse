# domains/chat — CHECKLIST

> **Quality Gates for Chat Domain**
> **Version:** `0.1.0`
> **Last Updated:** `2026-01-22`

---

## Type Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| All services have TypeScript interfaces | ⬜ | |
| All stores have typed state | ⬜ | |
| Mode configs match `ChatModeConfig` contract | ⬜ | |
| Tool schemas are valid JSON Schema | ⬜ | |
| Event types match Clyffy protocol | ⬜ | |

---

## Service Requirements

### interactions/services/

| Service | Types | JSDoc | Tests | Status |
|---------|-------|-------|-------|--------|
| `message.service.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `history.service.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `interaction.service.ts` | ⬜ | ⬜ | ⬜ | TODO |

### Service Contract

```typescript
/**
 * @service MessageService
 * @description Handles message send/receive operations
 * @fires chat:send
 * @listens clyffy:message
 */
```

---

## Store Requirements

### interactions/stores/

| Store | Runes Pattern | Types | Tests | Status |
|-------|---------------|-------|-------|--------|
| `messages.store.svelte.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `thread.store.svelte.ts` | ⬜ | ⬜ | ⬜ | TODO |

### Runes Pattern

```typescript
// ✅ CORRECT: Class with $state
class MessageStore {
    messages = $state<Message[]>([]);
    pending = $derived(/* ... */);
}
export const messageStore = new MessageStore();

// ❌ WRONG: Exported $state directly
export const messages = $state<Message[]>([]);
```

---

## Mode Requirements

### modes/

| Mode | Config | Validation | Tests | Status |
|------|--------|------------|-------|--------|
| `developer.mode.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `planning.mode.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `image.mode.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `general.mode.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `index.ts` | ⬜ | ⬜ | ⬜ | TODO |

### Mode Contract Checklist

- [ ] Implements `ChatModeConfig` interface
- [ ] `allowedHubs` matches hub route hierarchy
- [ ] `weight` correctly reflects context persistence
- [ ] `features` booleans match actual capabilities

---

## Tool Requirements

### tools/

| Tool | Schema | Execute | Tests | Status |
|------|--------|---------|-------|--------|
| `code-executor.tool.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `file-ops.tool.ts` | ⬜ | ⬜ | ⬜ | TODO |
| `index.ts` | ⬜ | ⬜ | ⬜ | TODO |

### Tool Contract Checklist

- [ ] Implements `ChatTool` interface
- [ ] JSON Schema validates input
- [ ] Returns `ToolResult` type
- [ ] Error handling doesn't throw (returns error result)

---

## Event Bus Integration

| Event | Direction | Types | Handler | Status |
|-------|-----------|-------|---------|--------|
| `chat:send` | → Clyffy | ⬜ | ⬜ | TODO |
| `chat:mode-change` | → Clyffy | ⬜ | ⬜ | TODO |
| `chat:interaction-response` | → Clyffy | ⬜ | ⬜ | TODO |
| `chat:tool-invoke` | → Clyffy | ⬜ | ⬜ | TODO |
| `clyffy:message` | ← Clyffy | ⬜ | ⬜ | TODO |
| `clyffy:interaction-request` | ← Clyffy | ⬜ | ⬜ | TODO |
| `clyffy:tool-result` | ← Clyffy | ⬜ | ⬜ | TODO |
| `clyffy:thinking` | ← Clyffy | ⬜ | ⬜ | TODO |

---

## JSDoc Standards

### Service Header

```typescript
/**
 * @module domains/chat/interactions/services/message.service
 * @description Message handling for chat domain
 * @version 0.1.0
 * @author DevPulse
 *
 * @fires chat:send - When user sends a message
 * @listens clyffy:message - When AI responds
 *
 * @example
 * import { MessageService } from './message.service';
 * const service = new MessageService();
 * await service.send('Hello, Gus!');
 */
```

### Store Header

```typescript
/**
 * @module domains/chat/interactions/stores/messages.store.svelte
 * @description Reactive message state using Svelte 5 runes
 * @version 0.1.0
 *
 * @runes
 * - messages: $state<Message[]> - All messages in thread
 * - pending: $derived<boolean> - Whether awaiting response
 *
 * @example
 * import { messageStore } from './messages.store.svelte';
 * messageStore.add({ content: 'Hello', author: 'user' });
 */
```

---

## Test Requirements

### Unit Tests

| Area | Min Coverage | Status |
|------|--------------|--------|
| Services | 80% | ⬜ |
| Stores | 80% | ⬜ |
| Modes | 100% | ⬜ |
| Tools | 80% | ⬜ |

### Integration Tests

| Test | Description | Status |
|------|-------------|--------|
| Mode switching | Hub context affects available modes | ⬜ |
| Tool invocation | Tool calls validated and executed | ⬜ |
| Event flow | Messages flow through event bus | ⬜ |

---

## Validation Rules

### Message Validation

```typescript
const messageSchema = {
    content: { type: 'string', minLength: 1, maxLength: 10000 },
    author: { enum: ['user', 'gus', 'system'] },
    timestamp: { type: 'number' },
    interactionId: { type: 'string', optional: true }
};
```

### Mode Validation

- Mode must be available for current hub
- Mode change only when no pending interaction

---

## Security Audit

| Check | Requirement | Status |
|-------|-------------|--------|
| No XSS | Message content sanitized | ⬜ |
| No injection | Tool inputs validated | ⬜ |
| Rate limiting | Service calls throttled | ⬜ |
| Context isolation | Modes don't leak context | ⬜ |

---

## ADR Compliance

| ADR | Requirement | Status |
|-----|-------------|--------|
| ADR-006 | Interaction contracts | ⬜ |
| ADR-007 | Event bus protocol | ⬜ |
| ADR-008 | Mode config schema | ⬜ |
| ADR-009 | Tool registration | ⬜ |

---

## Pre-Launch Checklist

- [ ] All services implemented with types
- [ ] All stores use runes pattern
- [ ] All modes configured correctly
- [ ] Event bus integration tested
- [ ] JSDoc headers complete
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] Security audit complete
- [ ] ADRs approved
- [ ] README current

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-22 | Initial checklist |
