# COLD LIGHT Design System - Style Guide

> **SSOT for code standards, file headers, and architectural boundaries.**
> All AI agents and developers MUST follow these patterns.

---

## File Header Standards

Every file MUST have a structured header comment. These headers enable:
- AI agents to understand file purpose without reading implementation
- Dependency graph analysis
- VPB no-code editing scope definition
- Impact analysis for changes

---

### TypeScript / JavaScript (`.ts`, `.js`)

```typescript
/**
 * @fileoverview [One-line description]
 * @module @devpulse/[path/from/lib]
 * @layer [tokens|primitives|semantics|compositions|domains|plugins]
 * 
 * @description
 * [2-3 sentence detailed description of purpose and responsibility]
 * 
 * @dependencies
 * - [./relative/path] ([what it provides])
 * 
 * @consumers
 * - [who/imports/this/*]
 * 
 * @vpb-editable [prop1, prop2] (if applicable)
 * @since [version]
 */
```

**Example:**
```typescript
/**
 * @fileoverview Barrel export for COLD LIGHT design tokens
 * @module @devpulse/design/tokens
 * @layer tokens
 * 
 * @description
 * Central export point for all CSS custom property definitions.
 * Tokens are the atomic values consumed by primitives and compositions.
 * 
 * @dependencies
 * - ./tokens.css (CSS custom properties)
 * 
 * @consumers
 * - primitives/* (all primitives consume tokens)
 * - app.css (global import)
 * 
 * @since 1.0.0
 */
```

---

### CSS Files (`.css`)

```css
/**
 * @file [path/from/design/file.css]
 * @layer [tokens|recipes|effects]
 * @description [One-line description]
 * 
 * Contents:
 * - [Category 1]
 * - [Category 2]
 * 
 * @vpb-editable [token-names or "all"]
 * @since [version]
 */
```

**Example:**
```css
/**
 * @file tokens/tokens.css
 * @layer tokens
 * @description COLD LIGHT Design System - Core design tokens (SSOT)
 * 
 * Contents:
 * - Colors (OKLCH hue-based)
 * - Spacing (fluid clamp)
 * - Typography (fluid)
 * - Effects (blur, glow, shadow)
 * - Depth (bevel tokens)
 * 
 * @vpb-editable hue, spacing, radius, effects
 * @since 1.0.0
 */
```

---

### Svelte Components (`.svelte`)

```svelte
<!--
  @file [path/from/lib/Component.svelte]
  @layer [primitives|semantics|compositions|domains|plugins]
  @aria [aria-pattern] (if applicable)
  
  [2-3 sentence description]
  
  Props:
  - [propName]: [type] - [description]
  
  @vpb-editable [prop1, prop2]
  @consumers [who/uses/this/*]
  @since [version]
-->
<script lang="ts">
```

**Example:**
```svelte
<!--
  @file primitives/Button.svelte
  @layer primitives
  @aria button
  
  Headless button primitive with full ARIA compliance.
  Uses Bits UI for behavior, custom styling via data-attributes.
  
  Props:
  - variant: "default" | "primary" | "ghost" | "destructive"
  - size: "sm" | "md" | "lg" | "icon"
  - disabled: boolean
  - loading: boolean
  
  @vpb-editable variant, size
  @consumers compositions/*, domains/*
  @since 1.0.0
-->
<script lang="ts">
```

---

## Layer Definitions

| Layer | Purpose | Location | VPB Editable |
|-------|---------|----------|--------------|
| `tokens` | CSS variables, raw atomic values | `design/tokens/` | Yes - values |
| `primitives` | Headless components (Bits UI) | `design/primitives/` | Yes - props |
| `semantics` | Token maps, styled primitives | `design/semantics/` | Yes - variants |
| `compositions` | Combined primitives | `design/compositions/` | Yes - layout |
| `domains` | Feature-specific (`vpb`, `wiredfront`) | `sys/*/`, `domains/*/` | Limited |
| `plugins` | Extensible features (`ParasiteLogo`) | `design/plugins/` | Custom UI |

---

## Required JSDoc Tags

### Mandatory (ALL files)
| Tag | Example | Purpose |
|-----|---------|---------|
| `@fileoverview` or `@file` | `@file tokens/index.ts` | Quick identification |
| `@layer` | `@layer primitives` | Architecture placement |
| `@since` | `@since 1.0.0` | Version tracking |

### Conditional
| Tag | When Required | Purpose |
|-----|---------------|---------|
| `@module` | TS/JS exports | Import path alias |
| `@aria` | Components with ARIA | Accessibility pattern |
| `@vpb-editable` | VPB-modifiable props | No-code scope |
| `@dependencies` | Non-trivial imports | Dependency graph |
| `@consumers` | Shared code | Impact analysis |

---

## Prop Constraint Patterns

All component props MUST use **union literal types** for VPB compatibility:

```typescript
// ✅ CORRECT - VPB can enumerate options
interface Props {
  variant: "default" | "primary" | "ghost" | "destructive";
  size: "sm" | "md" | "lg";
}

// ❌ WRONG - VPB cannot enumerate
interface Props {
  variant: string;
  size: string;
}
```

---

## Token Map Pattern

All primitives MUST use token maps for styling:

```typescript
// ✅ CORRECT - VPB can modify via props
const sizeMap: Record<Size, string> = {
  sm: "var(--dp-space-2)",
  md: "var(--dp-space-4)",
  lg: "var(--dp-space-6)",
};

// ❌ WRONG - Hardcoded values
const sizeMap = {
  sm: "8px",
  md: "16px",
  lg: "24px",
};
```

---

## CSS Variable Injection

Components MUST inject computed values via CSS variables:

```svelte
<!-- ✅ CORRECT - Dynamic CSS variables -->
<div
  style:--computed-padding={sizeMap[size]}
  style:--computed-radius={radiusMap[radius]}
>

<!-- ❌ WRONG - Inline styles -->
<div style="padding: 16px; border-radius: 8px;">
```

---

## Zero Tolerance Rules

1. **No hardcoded colors** - All colors via `--dp-*` tokens
2. **No hardcoded spacing** - All spacing via `--dp-space-*` tokens  
3. **No magic numbers** - All values must reference tokens
4. **No duplicate components** - Single source of truth per primitive
5. **No string props** - Union literals only for VPB compatibility
6. **No scoped styles with raw values** - Token maps required

---

## Verification Checklist

Before committing any design system code:

- [ ] File has complete header comment
- [ ] `@layer` tag matches folder location
- [ ] Props use union literal constraints
- [ ] Token maps used for all visual values
- [ ] No hardcoded colors/spacing in `<style>`
- [ ] `@vpb-editable` lists modifiable props
- [ ] Component uses CSS variable injection
- [ ] Bits UI primitive used for behavior (if applicable)

---

## AI Agent Instructions

When generating or modifying design system files:

1. **Always include file header** with all mandatory tags
2. **Match layer to folder** - `primitives/` files get `@layer primitives`
3. **Extract all values to tokens** - Never hardcode visual values
4. **Use union literals** - Enable VPB enumeration
5. **Document consumer impact** - List who uses this code
6. **Verify token usage** - grep for hardcoded `oklch(`, `px`, `rem` values
