# Engine Maintenance Protocol

## REQUIRED_STEP 1: Core Dependency
- Engine MUST depend on `devpulse-core` for all shared types.
- Do NOT define new `Signal` types here. Use `SignalKind::Standard` or request a Core update.

## REQUIRED_STEP 2: The Facade Rule
- Engine processes `StandardSignal` variants transparently.
- Engine routes `ProprietarySignal` variants blindly to Maestro. Do NOT attempt to unwrap `ProprietarySignal`.

## REQUIRED_STEP 3: Elite Build Protocol
- Zero warnings. Implement logic or remove dead code.
