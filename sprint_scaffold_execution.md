# Sprint: The Absolute Scaffolding Execution
**Status:** READY_TO_EXECUTE
**Protocol:** STRICT_SCALAR_ALIGNMENT

> **Goal**: Aggressively scaffold the "Absolute Map" for the full platform (Desktop + Kernel + Systems).
> **Input References**: User Request Step 55 (Folder Map), User Request Step 50 (Component Details).

## 1. Backend Cleanup (The Foundation)
**Reason**: Align strict definitions of IP (Maestro) vs Facade (Engine) vs Tools (xtask).

### Step 1.1: Maestro Consolidation
- **Audit**: `systems/maestro` (Active) vs `kernel/maestro` (Stub).
- **Action**: Move all content from `systems/maestro` to `kernel/maestro`.
- **Verify**: `systems/maestro` is empty/deleted. `kernel/maestro/Cargo.toml` exists.

### Step 1.2: Engine Reset
- **Audit**: `systems/engine` is empty/drifted.
- **Action**: Delete `systems/engine`. Initialize `kernel/engine` (The Facade).
- **Verify**: `kernel/engine` exists.

---

## 2. Frontend Scaffolding (The Map)
**Root**: `interfaces/desktop/src/lib`
**Constraint**: Strict adherence to the Step 55 Folder Structure.

### Step 2.1: Layouts (The Shell)
- **Path**: `src/lib/layouts/`
- **Actions**:
    1.  Ensure `chat/` folder exists.
    2.  Create/Verify Components:
        -   `chat/Frame.svelte`
        -   `chat/TopBar.svelte`
        -   `chat/LeftSidebar.svelte`
        -   `chat/QuickMenu.svelte`
    3.  Ensure `dashboard/` folder exists.
        -   Create/Verify: `dashboard/Frame.svelte`.
    4.  **Cleanup**: Rename/Refactor strict `app` folder if it conflicts or doesn't map to these.

### Step 2.2: Domains (The Functional Areas)
- **Path**: `src/lib/domains/`
- **Actions**: Create the following 6 folders (Strict):
    1.  `home/` (Dashboard)
    2.  `projects/` (General)
    3.  `devspace/` (Production)
    4.  `thinkspace/` (Experimental)
    5.  `sharespace/` (Collaboration - *Migrate `wiredfront` here*)
    6.  `system/` (Settings)

### Step 2.3: Component population (Stubbing)
- Populate the Domains with their respective "Frame" components (as defined in Step 50) but aligned to the new folder structure.
    - `domains/home/HomeFrame.svelte`
    - `domains/devspace/DevSpaceFrame.svelte` (from Step 50)
    - `domains/thinkspace/ThinkSpaceFrame.svelte` (from Step 50)
    - `domains/sharespace/WiredHubFrame.svelte` (WiredFront becomes ShareSpace hub)

---

## 3. Platform Systems
- **Path**: `systems/`
- **Actions**:
    - Ensure `userdata/` exists.
    - Ensure `xtask/` exists.

## 4. Verification Checklist
- [ ] `kernel/maestro` contains the core IP logic.
- [ ] `systems/engine` is GONE.
- [ ] `src/lib/layouts/chat` exists with 4 components.
- [ ] `src/lib/domains` has exactly 6 folders.
- [ ] Build passes (`cargo build`, `npm run build`).
