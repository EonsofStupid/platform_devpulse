# COLD LIGHT Design System — AI Agent Instructions (Registry-First)

> READ THIS BEFORE WRITING ANY CODE IN THIS DESIGN SYSTEM.
> If you violate this file, you create drift and your work is rejected.

---

## 🛑 MANDATORY PRE-CODE SEQUENCE (Registry Gate)

You are NOT allowed to write new `.svelte` renderers until registries exist.

**Registry order is strict:**
Tokens (SSOT) → Taxonomy → Recipes → VPB Blocks → Renderers (.svelte)

yaml
Copy code

If any step fails: **STOP** and fix registries first.

---

## ✅ STEP 0 — Identify What You Are Adding

You must identify ONE of these targets:

- **Token Key / Value** (theme values, semantic tokens)
- **Block Kind** (taxonomy kind + contract + slots)
- **Recipe** (style output + required actions)
- **VPB Block** (palette + defaults + inspector)
- **Renderer** (applies recipe classes only)

If you cannot name the target, you do not understand the change yet. STOP.

---

## ✅ STEP 1 — Tokens Check (SSOT = tokens.ts)

### RULE: `tokens.ts` is SSOT. `tokens.css` is GENERATED OUTPUT.
- You NEVER hand-edit `tokens.css`
- You ALWAYS edit `tokens.ts` and run the generator

Commands:
```bash
pnpm ds:tokens:build
pnpm ds:tokens:watch
Token existence check
Search token keys in tokens.ts (SSOT), not tokens.css:

bash
Copy code
grep -r "dp-" src/lib/design/tokens/tokens.ts
If a required token key does not exist:
✅ Add it to tokens.ts → run pnpm ds:tokens:build

✅ STEP 2 — Taxonomy Contract (Kinds + Props + Slots)
If you are adding OR changing a block kind:

Required files:

src/lib/design/taxonomy/kinds.ts

src/lib/design/taxonomy/contracts.ts

src/lib/design/taxonomy/slots.ts

Rules:

Props MUST be union-literal enums (VPB enumerable)

Slots MUST be explicitly defined

Allowed children per slot MUST be defined

Shell kinds MUST declare grid constraint

Example constraint:

layoutMode: "grid" for appShell, dock, dashboards, panels

If taxonomy entry is missing: STOP.

✅ STEP 3 — Recipe Authoring (Only place visuals exist)
RULE: Recipes are the only place allowed to decide styling outputs.
No renderer is allowed to style itself.

Recipes live here:

swift
Copy code
src/lib/design/recipes/
Each recipe MUST include:

id

classes(props) -> slotClassMap

optional requires: ActionId[]

Example:

ts
Copy code
"panel.glass.glow": {
  classes: (props) => ({ root: "..." }),
  requires: ["glowTrack"]
}
Tailwind constraint
Recipe output MUST be composed from known Tailwind utilities / preset utilities.
No raw color functions or arbitrary values.

✅ STEP 4 — Action Attachment (No manual JS)
If a visual effect requires JS (glow tracking, ripple, etc):

✅ Recipe declares requires: ["glowTrack"]
✅ Renderer auto-attaches required actions
❌ No manual handler wiring in renderers for visual tracking

Allowed action folder:

swift
Copy code
src/lib/design/recipes/actions/
✅ STEP 5 — VPB Registration (Composition Rules)
If a kind or recipe exists, VPB must be able to use it.

VPB must:

list block kind in palette

assign default recipe id

assign default typed props

restrict inspector to enum controls only

VPB lives here:

swift
Copy code
src/lib/sys/debug/vpb/
If VPB cannot create the block legally: STOP.

✅ STEP 6 — Renderer Permission (LAST)
Renderers exist ONLY after registries exist.

Renderers live here:

swift
Copy code
src/lib/design/renderers/
Renderer rules:

Receives BlockNode (kind + recipe + props + slots)

Calls recipe registry to resolve classes

Applies classes per slot

Auto-attaches recipe actions

Uses NO theme values inside component

Does NOT contain styling logic

🚫 FORBIDDEN PATTERNS (Auto-Reject)
1) No hand editing generated files
❌ Edit tokens.css
❌ Edit types.ts
❌ Edit tailwind.preset.ts (if generated)

Generated files are OUTPUT ONLY.

2) No hardcoded visual values anywhere in DS renderers/recipes
Forbidden patterns:

raw colors: #, oklch(, rgb(, hsl(

raw spacing: 12px, 1rem

inline styles: style="..."

✅ Use token-backed Tailwind classes from recipes/preset.

3) No Tailwind arbitrary values
❌ Any class containing [...] is banned.
Examples:

bg-[#00ff00]

text-[12px]

grid-cols-[auto,1fr]

If you need a custom layout utility:
✅ add a named utility via preset/plugin instead.

4) No Bits UI imports outside primitives/
Bits UI is ONLY allowed in:

swift
Copy code
src/lib/design/primitives/
Everywhere else:
❌ import ... from "bits-ui"

5) No component-level theme variable chains
Forbidden:

--dp-panel--vpb-panel

component-scoped theme vars

per-component token naming

Tokens must be root-scoped and semantic.

6) No “visual tracking” event handlers without recipe.requires
Renderers must not contain glow/ripple tracking logic.
That belongs to recipe actions.

Allowed behavior handlers:

click/submit/keydown for real app behavior
Forbidden visual tracking handlers unless via action:

mousemove/pointermove/scroll tracking for visuals

✅ Import Boundary Rules (Updated)
Area	CAN Import	CANNOT Import
design/tokens/	none (SSOT)	app code
design/taxonomy/	tokens/types	VPB state
design/recipes/	tokens + taxonomy types	Bits UI
design/primitives/	Bits UI + tokens	VPB internal state
design/renderers/	taxonomy + recipes	Bits UI
sys/debug/vpb/	taxonomy + recipes	Bits UI
domains/*	notify + services	Bits UI

Svelte State Pattern (Data Attributes)
Use data-* attributes for stateful styling:

✅ Correct:

svelte
Copy code
<div data-state={open ? "open" : "closed"} />
CSS:

css
Copy code
[data-state="open"] { ... }
Common attributes:

data-state (active/inactive/open/closed)

data-mode (docked/floating/minimized)

data-variant (primary/ghost)

data-size (sm/md/lg)

File Header Requirement
All files MUST include the header template from STYLE_GUIDE.md.

Missing headers = reject.

Self-Check Before Committing (Kill Switch)
Run these commands and ensure output is EMPTY:

bash
Copy code
# 1) No raw colors
grep -rE "(#|oklch\\(|rgb\\(|hsl\\()" src/lib/design --include="*.ts" --include="*.svelte" --include="*.css"

# 2) No arbitrary Tailwind values (brackets)
grep -rE "\\[[^\\]]+\\]" src/lib/design --include="*.ts" --include="*.svelte"

# 3) No bits-ui imports outside primitives
grep -r "from 'bits-ui'" src/lib --include="*.ts" --include="*.svelte" | grep -v "src/lib/design/primitives"

# 4) No dp/ds vars in svelte components
grep -rE "var\\(--(dp|ds)-" src/lib/design --include="*.svelte"

# 5) Tokens pipeline must be clean
pnpm ds:tokens:build