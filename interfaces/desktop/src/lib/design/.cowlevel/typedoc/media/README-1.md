# Blocks

> **Layer 6: The Accessible Unit. ARIA applied here.**

---

## The Core Principle

**Blocks are where ARIA gets applied.**

Primitives provide structure + state.
dsAdapter provides behavior + ARIA capabilities.
Blocks compose primitives and apply ARIA at render time.

---

## Why ARIA at Block Level?

Primitives do not know their context:

| Primitive | Context A | Context B | ARIA Needed |
|-----------|-----------|-----------|-------------|
| dialog | Modal | Alert | role=dialog vs alertdialog |
| button | Form submit | Toolbar toggle | button vs aria-pressed |
| panel | Sidebar | Disclosure | complementary vs expanded |

**The block knows the context. The primitive does not.**

---

## Block Responsibilities

| Responsibility | Block Provides |
|----------------|----------------|
| Compose primitives | Yes |
| Apply ARIA attributes | Yes |
| Apply keyboard handlers | Yes |
| Apply focus management | Yes |
| VPB-editable props | Yes |
| Context awareness | Yes |

---

## How ARIA Gets Applied

dsAdapter reads the contract and auto-applies at block render:

`svelte
<!-- blocks/settings/SettingsTabs.svelte -->
<script>
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "/design/primitives/tabs";
  import { applyAria } from "/design/taxonomy/.generated/aria.gen";
  
  // dsAdapter applies ARIA based on contract + context
  const aria = applyAria("tabs", { context: "settings-panel" });
</script>

<Tabs {...aria.root}>
  <TabsList {...aria.list}>
    <TabsTrigger {...aria.trigger} value="general">General</TabsTrigger>
    <TabsTrigger {...aria.trigger} value="security">Security</TabsTrigger>
  </TabsList>
  <TabsContent {...aria.content} value="general">...</TabsContent>
  <TabsContent {...aria.content} value="security">...</TabsContent>
</Tabs>
`

---

## Categories

| Category | Description | Purpose |
|----------|-------------|---------|
| heroes/ | Hero sections | Landing page hero blocks |
| features/ | Feature grids | Feature showcase blocks |
| dashboards/ | Dashboard layouts | Dashboard widget blocks |
| chat/ | Chat interfaces | Chat UI blocks |
| cta/ | Call-to-action | CTA blocks |
| carousels/ | Carousel/slider | Content carousel blocks |
| navigation/ | Navigation | Nav blocks |

---

## File Structure

`
blocks/{category}/
+-- {Name}.svelte            # Block component
+-- {name}.preset.ts         # Default recipe preset (if applicable)
+-- README.md                # Category documentation
`

---

## VPB Integration

Blocks are the unit that Visual Page Builder works with:

1. User drags block onto canvas
2. VPB reads contract for ARIA requirements
3. dsAdapter applies ARIA at render
4. Accessibility is enforced by architecture

### VPB-Editable Props

`svelte
<!-- @vpb-editable -->
<script>
  /**
   * @vpb-prop headline - Main headline text
   * @vpb-prop cta - Call to action button text
   * @vpb-prop variant - Visual variant (glass, solid, gradient)
   */
  let { headline, cta, variant = "glass" }: HeroProps = ();
</script>
`

---

## Block Contract (TO BE BUILT)

Each block will have a contract in taxonomy:

`
taxonomy/kinds/blocks/{name}/contract.ts
    - uses: which primitives/composites
    - context: what ARIA context applies
    - vpbProps: editable properties
`

---

## Checklist

### Before Adding a Block

- [ ] Primitives exist for all composed components
- [ ] Determine correct category folder
- [ ] Identify ARIA context for this block

### File Requirements

- [ ] `{Name}.svelte` block component
- [ ] VPB-editable props documented with @vpb-prop
- [ ] ARIA applied via dsAdapter
- [ ] Category README updated

---

## Current Status

Block infrastructure is being built. Current categories are placeholders.

The key architectural decision is confirmed:
- **Primitives = structure + state**
- **Blocks = accessible unit with ARIA**

---

**Blocks are where accessibility happens.**