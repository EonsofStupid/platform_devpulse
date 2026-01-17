# IP PROTECTION PROTOCOL (Feature Flag Constitution)
> **Goal**: Protect Internal IP ("The Secret Sauce") from Public Exposure.
> **Mechanism**: Strict Feature Flags & SSOT Alignment.
> **Enforcement**: Mandatory Checklist for EVERY scaffolding step.

## 1. The Single Source of Truth (SSOT)
*   **File**: `src/lib/cfg/flags.ts`
*   **Definition**: A strictly typed object defining `enabled` states for all advanced mechanics.
*   **Default**: ALL IP-related flags must default to `false` (Public Safe Mode).

### Protected Zones (IP)
1.  **Maestro's Inner Monologue**: The raw "Thought Process" or internal prompt construction.
2.  **Dynamic Builder UI**: The middleware that generates UI from AI.
3.  **Detailed Analytics**: The "Journey" emotional graphing algorithms.
4.  **Minion Personality Matrix**: The raw "Gus" or "Architect" logic.

## 2. The Implementation Checklist
> **Rule**: Before writing ANY component code, you must check:

- [ ] **Is this IP?** (Is it a unique differentiator or internal tool?)
- [ ] **If YES**: Is there a flag in `lib/cfg/flags.ts`? (e.g., `ENABLE_MAESTRO_DEBUG`)
- [ ] **Is the Component Guarded?**
    ```svelte
    {#if flags.MAESTRO_DEBUG}
       <MaestroThoughtProcess />
    {/if}
    ```
- [ ] **Is the Logic Guarded?** (Rust/TS logic requires the same flag check).

## 3. The Dev-Tools Alignment
*   **Dev-Tools**: Are purely for `devpulse` platform maintenance.
*   **Requirement**: They MUST be visible only when `flags.DEV_MODE` is active.

## 4. Verification
*   **Test**: Run the app with `DEV_MODE = false`. Does the IP disappear?
*   **Pass**: The Layman sees only the "Output", never the "Process".
