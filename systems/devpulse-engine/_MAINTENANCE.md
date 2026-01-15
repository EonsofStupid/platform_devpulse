# Engine Maintenance Protocol (The Facade Law)

> **STATUS**: PROTECTED
> **ROLE**: Public Type System & Translator.

## 1. The Strict Law of Types
- **Derive TS**: All public structs MUST derive `TS` (ts-rs).
- **Derive Serde**: All public structs MUST derive `Serialize, Deserialize`.
- **No Logic**: This crate is for *Routing* and *Types*. It does not "Think".

## 2. The Law of Traffic
- **Signal Only**: All inter-domain communication happens via `SignalEnvelope`.
- **Blind Routing**: Proprietary signals are passed as `Value` or opaque pointers. Do not deserialize IP here.

## 3. The Changelog (Active)
- [2026-01-14] Initial Guardrail Enforcement.
