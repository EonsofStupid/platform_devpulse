# Desktop Sprint 0: Fresh Build

**Purpose:** Build NEW desktop from scratch. Reference bad_desktop for proven code ONLY.

---

## What We're Building (NEW)

```
alpha/desktop/                    # NEW - Build fresh
├── src-tauri/                    # Tauri backend
│   ├── Cargo.toml               # ONLY engine dependency
│   └── src/
│       ├── lib.rs
│       ├── main.rs
│       ├── state.rs
│       └── commands/
│
├── src/                          # SvelteKit frontend
│   ├── app.html
│   ├── app.css                  # Imports design system
│   ├── styles/                  # COPY from bad_desktop (proven SSOT)
│   ├── routes/
│   └── lib/
│       ├── layouts/             # Dumb shells
│       ├── domains/             # Smart content
│       ├── primitives/          # Atomic UI
│       └── sys/                 # Stores, API, theme
│
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## What to REFERENCE from bad_desktop (READ ONLY - NO COPYING)

| File | What to Learn |
|------|---------------|
| `bad_desktop/src/styles/tokens/colors.css` | OKLCH color system, --dp-hue theming |
| `bad_desktop/src/styles/recipes/glass.css` | Glass bevel system, tint classes |
| `bad_desktop/src-tauri/Cargo.toml` | Dependencies list |
| `bad_desktop/src-tauri/src/commands/*.rs` | Command patterns |
| `bad_desktop/package.json` | Package versions |

**Read. Understand. Write fresh.**

---

## Phase 1: Project Setup

### 1.1 Create directory structure

```bash
cd alpha/desktop
mkdir -p src-tauri/src/commands
mkdir -p src/routes
mkdir -p src/lib/layouts/app/frame
mkdir -p src/lib/layouts/chat/frame
mkdir -p src/lib/domains/chat
mkdir -p src/lib/primitives
mkdir -p src/lib/sys/stores
mkdir -p src/lib/sys/api
```

### 1.2 Create config files (write fresh)

**package.json**
```json
{
  "name": "devpulse-desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@tauri-apps/cli": "^2.0.0",
    "svelte": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0"
  }
}
```

**svelte.config.js**
```js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({ fallback: 'index.html' })
  }
};
```

**vite.config.ts**
```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: { port: 5173, strictPort: true }
});
```

**tsconfig.json**
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

---

## Phase 2: Tauri Backend (Fresh)

### 2.1 Cargo.toml

```toml
[package]
name = "devpulse-desktop"
version = "0.1.0"
edition = "2021"

[lib]
name = "devpulse_desktop_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"

# ONLY engine - NEVER orchestrator
engine = { path = "../../engine" }

tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1"
tracing = "0.1"
```

### 2.2 src/lib.rs

```rust
mod commands;
mod state;

pub use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::chat,
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri");
}
```

### 2.3 src/main.rs

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    devpulse_desktop_lib::run()
}
```

### 2.4 src/state.rs

```rust
pub struct AppState {
    // Engine handle goes here
}

impl AppState {
    pub fn new() -> Self {
        Self {}
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
```

### 2.5 src/commands/mod.rs

```rust
mod chat;
pub use chat::chat;
```

### 2.6 src/commands/chat.rs

```rust
use tauri::State;
use crate::AppState;

#[derive(serde::Serialize)]
pub struct ChatResponse {
    pub text: String,
}

#[tauri::command]
pub async fn chat(
    message: String,
    _state: State<'_, AppState>,
) -> Result<ChatResponse, String> {
    Ok(ChatResponse {
        text: format!("Echo: {}", message),
    })
}
```

### 2.7 build.rs

```rust
fn main() {
    tauri_build::build()
}
```

### 2.8 tauri.conf.json

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "DevPulse",
  "version": "0.1.0",
  "identifier": "com.devpulse.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../build"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [{ "title": "DevPulse", "width": 1200, "height": 800 }],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/icon.ico"]
  }
}
```

---

## Phase 3: SvelteKit Frontend (Fresh)

### 3.1 src/app.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

### 3.2 src/app.css

```css
@import "./styles/index.css";
```

### 3.3 src/routes/+layout.svelte

```svelte
<script>
  import '../app.css';
  import { AppFrame } from '$lib/layouts/app';

  let { children } = $props();
</script>

<AppFrame>
  {#snippet main()}
    {@render children()}
  {/snippet}
</AppFrame>
```

### 3.4 src/routes/+layout.ts

```ts
export const prerender = true;
export const ssr = false;
```

### 3.5 src/routes/+page.svelte

```svelte
<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { ChatFrame } from '$lib/layouts/chat';

  let message = $state('');
  let response = $state('');

  async function send() {
    if (!message.trim()) return;
    const result = await invoke<{ text: string }>('chat', { message });
    response = result.text;
    message = '';
  }
</script>

<ChatFrame>
  {#snippet messages()}
    {#if response}
      <div class="glass-card" style="padding: var(--dp-space-4);">
        {response}
      </div>
    {/if}
  {/snippet}

  {#snippet input()}
    <form onsubmit={send} style="display: flex; gap: var(--dp-space-2); width: 100%;">
      <input
        class="glass-input"
        bind:value={message}
        placeholder="Type a message..."
        style="flex: 1; padding: var(--dp-space-3);"
      />
      <button class="glass-button btn-primary" type="submit">Send</button>
    </form>
  {/snippet}
</ChatFrame>
```

---

## Phase 4: Layout Components (Fresh)

### 4.1 src/lib/layouts/app/frame/AppFrame.svelte

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    topbar?: Snippet;
    sidebar?: Snippet;
    main?: Snippet;
    statusbar?: Snippet;
  }

  let { topbar, sidebar, main, statusbar }: Props = $props();
</script>

<div class="app-frame">
  <header class="app-topbar glass-bar">
    {#if topbar}{@render topbar()}{/if}
  </header>

  <aside class="app-sidebar glass-sidebar">
    {#if sidebar}{@render sidebar()}{/if}
  </aside>

  <main class="app-main">
    {#if main}{@render main()}{/if}
  </main>

  <footer class="app-statusbar glass-bar-bottom">
    {#if statusbar}{@render statusbar()}{/if}
  </footer>
</div>

<style>
  .app-frame {
    display: grid;
    grid-template-areas:
      "topbar topbar"
      "sidebar main"
      "statusbar statusbar";
    grid-template-rows: var(--dp-topbar-height, 52px) 1fr var(--dp-statusbar-height, 28px);
    grid-template-columns: var(--dp-sidebar-width, 240px) 1fr;
    height: 100vh;
  }

  .app-topbar { grid-area: topbar; }
  .app-sidebar { grid-area: sidebar; }
  .app-main { grid-area: main; overflow: auto; padding: var(--dp-space-4); }
  .app-statusbar { grid-area: statusbar; }
</style>
```

### 4.2 src/lib/layouts/app/index.ts

```ts
export { default as AppFrame } from './frame/AppFrame.svelte';
```

### 4.3 src/lib/layouts/chat/frame/ChatFrame.svelte

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    header?: Snippet;
    messages?: Snippet;
    input?: Snippet;
  }

  let { header, messages, input }: Props = $props();
</script>

<div class="chat-frame">
  {#if header}
    <header class="chat-header">{@render header()}</header>
  {/if}

  <div class="chat-messages">
    {#if messages}{@render messages()}{/if}
  </div>

  <div class="chat-input glass">
    {#if input}{@render input()}{/if}
  </div>
</div>

<style>
  .chat-frame {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .chat-header {
    flex-shrink: 0;
    padding: var(--dp-space-3);
    border-bottom: 1px solid var(--dp-glass-border);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--dp-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--dp-space-3);
  }

  .chat-input {
    flex-shrink: 0;
    padding: var(--dp-space-3);
  }
</style>
```

### 4.4 src/lib/layouts/chat/index.ts

```ts
export { default as ChatFrame } from './frame/ChatFrame.svelte';
```

---

## File Checklist (What to Create)

### Config Files (5)
- [ ] `package.json`
- [ ] `svelte.config.js`
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `.gitignore`

### Tauri Backend (7)
- [ ] `src-tauri/Cargo.toml`
- [ ] `src-tauri/tauri.conf.json`
- [ ] `src-tauri/build.rs`
- [ ] `src-tauri/src/main.rs`
- [ ] `src-tauri/src/lib.rs`
- [ ] `src-tauri/src/state.rs`
- [ ] `src-tauri/src/commands/mod.rs`
- [ ] `src-tauri/src/commands/chat.rs`

### SvelteKit Frontend (7)
- [ ] `src/app.html`
- [ ] `src/app.css`
- [ ] `src/routes/+layout.svelte`
- [ ] `src/routes/+layout.ts`
- [ ] `src/routes/+page.svelte`
- [ ] `src/lib/layouts/app/frame/AppFrame.svelte`
- [ ] `src/lib/layouts/app/index.ts`
- [ ] `src/lib/layouts/chat/frame/ChatFrame.svelte`
- [ ] `src/lib/layouts/chat/index.ts`

### Design System (Write Fresh - Full Audit Below)
- [ ] `src/styles/tokens/colors.css` - OKLCH palette, theming
- [ ] `src/styles/tokens/space.css` - Spacing scale, shell dimensions
- [ ] `src/styles/tokens/type.css` - Fonts, sizes, weights
- [ ] `src/styles/tokens/radius.css` - Border radii
- [ ] `src/styles/tokens/shadow.css` - Elevations, glows
- [ ] `src/styles/tokens/motion.css` - Durations, easings
- [ ] `src/styles/tokens/index.css` - Barrel
- [ ] `src/styles/primitives/reset.css` - CSS reset
- [ ] `src/styles/primitives/base.css` - Element defaults
- [ ] `src/styles/primitives/index.css` - Barrel
- [ ] `src/styles/recipes/glass.css` - Glass system (~760 lines)
- [ ] `src/styles/recipes/metallic.css` - Chrome bevels
- [ ] `src/styles/recipes/buttons.css` - Button variants
- [ ] `src/styles/recipes/inputs.css` - Form elements
- [ ] `src/styles/recipes/cards.css` - Cards, panels
- [ ] `src/styles/recipes/badges.css` - Badges, dots
- [ ] `src/styles/recipes/backgrounds.css` - Animated backgrounds
- [ ] `src/styles/recipes/index.css` - Barrel
- [ ] `src/styles/keyframes/glow.css` - Glow animations
- [ ] `src/styles/keyframes/motion.css` - Movement animations
- [ ] `src/styles/keyframes/loading.css` - Spinners, shimmer
- [ ] `src/styles/keyframes/index.css` - Barrel
- [ ] `src/styles/utilities/layout.css` - Flex, grid helpers
- [ ] `src/styles/utilities/text.css` - Typography helpers
- [ ] `src/styles/utilities/hover.css` - Interactive states
- [ ] `src/styles/utilities/index.css` - Barrel
- [ ] `src/styles/index.css` - Entry point

---

## Acceptance Criteria

- [ ] `npm install` succeeds
- [ ] `npm run dev` starts Vite
- [ ] `cargo check -p devpulse-desktop` passes
- [ ] `npm run tauri dev` opens window
- [ ] Can type message, send, see echo
- [ ] Glass styling works (design system loaded)
- [ ] NO orchestrator dependency anywhere

---

## APPENDIX A: Complete CSS Audit (bad_desktop Reference)

> **IMPORTANT:** This is documentation only. Write fresh using these patterns.

---

### A.1 TOKENS - Design Variables

#### colors.css - OKLCH Palette System
```css
:root {
  /* Base Hue (themeable) */
  --dp-hue: 195;  /* Cyan/Teal default */

  /* Obsidian Grays (background scale) */
  --dp-obsidian-950: oklch(6% 0.02 var(--dp-hue));   /* Deepest */
  --dp-obsidian-900: oklch(10% 0.025 var(--dp-hue));
  --dp-obsidian-850: oklch(13% 0.03 var(--dp-hue));
  --dp-obsidian-800: oklch(16% 0.03 var(--dp-hue));
  --dp-obsidian-750: oklch(20% 0.025 var(--dp-hue));
  --dp-obsidian-700: oklch(25% 0.02 var(--dp-hue));

  /* Accent Colors */
  --dp-accent-primary: oklch(70% 0.18 var(--dp-hue));
  --dp-accent-secondary: oklch(75% 0.15 calc(var(--dp-hue) + 30));
  --dp-accent-teal: oklch(70% 0.14 180);
  --dp-accent-purple: oklch(65% 0.2 280);
  --dp-accent-gold: oklch(78% 0.16 85);

  /* Semantic Colors */
  --dp-success: oklch(72% 0.2 145);
  --dp-warning: oklch(78% 0.18 75);
  --dp-error: oklch(65% 0.25 25);
  --dp-info: oklch(70% 0.16 230);

  /* Text Colors */
  --dp-text-primary: oklch(95% 0.015 var(--dp-hue));
  --dp-text-secondary: oklch(75% 0.02 var(--dp-hue));
  --dp-text-muted: oklch(55% 0.015 var(--dp-hue));
  --dp-text-dim: oklch(40% 0.01 var(--dp-hue));

  /* Glass Surface Colors */
  --dp-glass-bg: oklch(8% 0.03 var(--dp-hue) / 0.85);
  --dp-glass-bg-solid: oklch(12% 0.03 var(--dp-hue));
  --dp-glass-border: oklch(35% 0.05 var(--dp-hue) / 0.3);
  --dp-glass-border-bright: oklch(50% 0.1 var(--dp-hue) / 0.4);
  --dp-glass-highlight: oklch(75% 0.08 var(--dp-hue) / 0.15);

  /* Background Tokens */
  --dp-bg-primary: var(--dp-obsidian-950);
  --dp-bg-elevated: var(--dp-obsidian-900);
  --dp-bg-surface: var(--dp-obsidian-850);
}

/* Theme Variants (data attribute) */
[data-theme="cyan"]   { --dp-hue: 195; }
[data-theme="teal"]   { --dp-hue: 180; }
[data-theme="purple"] { --dp-hue: 280; }
[data-theme="gold"]   { --dp-hue: 45; }
[data-theme="blue"]   { --dp-hue: 230; }
[data-theme="coral"]  { --dp-hue: 15; }
```

#### space.css - Spacing Scale
```css
:root {
  /* Spacing Scale (rem) */
  --dp-space-0: 0;
  --dp-space-1: 0.25rem;   /* 4px */
  --dp-space-2: 0.5rem;    /* 8px */
  --dp-space-3: 0.75rem;   /* 12px */
  --dp-space-4: 1rem;      /* 16px */
  --dp-space-5: 1.25rem;   /* 20px */
  --dp-space-6: 1.5rem;    /* 24px */
  --dp-space-8: 2rem;      /* 32px */
  --dp-space-10: 2.5rem;   /* 40px */
  --dp-space-12: 3rem;     /* 48px */
  --dp-space-16: 4rem;     /* 64px */

  /* Shell Dimensions */
  --dp-topbar-height: 3.25rem;    /* 52px */
  --dp-statusbar-height: 2.25rem; /* 36px */
  --dp-sidebar-collapsed: 4rem;   /* 64px */
  --dp-sidebar-expanded: 14.375rem; /* 230px */
}
```

#### type.css - Typography
```css
:root {
  /* Font Families */
  --dp-font-display: 'Oxanium', 'Inter', sans-serif;
  --dp-font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --dp-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Sizes */
  --dp-text-xs: 0.75rem;   /* 12px */
  --dp-text-sm: 0.875rem;  /* 14px */
  --dp-text-base: 1rem;    /* 16px */
  --dp-text-lg: 1.125rem;  /* 18px */
  --dp-text-xl: 1.25rem;   /* 20px */
  --dp-text-2xl: 1.5rem;   /* 24px */
  --dp-text-3xl: 1.875rem; /* 30px */
  --dp-text-4xl: 2.25rem;  /* 36px */

  /* Font Weights */
  --dp-font-normal: 400;
  --dp-font-medium: 500;
  --dp-font-semibold: 600;
  --dp-font-bold: 700;

  /* Line Heights */
  --dp-leading-none: 1;
  --dp-leading-tight: 1.25;
  --dp-leading-normal: 1.5;
  --dp-leading-relaxed: 1.625;
}
```

#### radius.css - Border Radius
```css
:root {
  --dp-radius-sm: 0.25rem;  /* 4px */
  --dp-radius: 0.5rem;      /* 8px */
  --dp-radius-md: 0.75rem;  /* 12px */
  --dp-radius-lg: 1rem;     /* 16px */
  --dp-radius-xl: 1.5rem;   /* 24px */
  --dp-radius-full: 9999px;
}
```

#### shadow.css - Shadows
```css
:root {
  /* Elevation Shadows */
  --dp-shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.3);
  --dp-shadow-md: 0 4px 6px oklch(0% 0 0 / 0.3);
  --dp-shadow-lg: 0 10px 15px oklch(0% 0 0 / 0.4);
  --dp-shadow-xl: 0 20px 25px oklch(0% 0 0 / 0.5);

  /* Glow Shadows */
  --dp-glow-sm: 0 0 10px oklch(65% 0.2 var(--dp-hue) / 0.2);
  --dp-glow-md: 0 0 20px oklch(65% 0.2 var(--dp-hue) / 0.3);
  --dp-glow-lg: 0 0 30px oklch(65% 0.2 var(--dp-hue) / 0.4);

  /* Inset Shadows */
  --dp-inset-sm: inset 0 1px 2px oklch(0% 0 0 / 0.2);
  --dp-inset-md: inset 0 2px 4px oklch(0% 0 0 / 0.3);
  --dp-inset-highlight: inset 0 1px 1px oklch(100% 0 0 / 0.05);
}
```

#### motion.css - Timing
```css
:root {
  /* Durations */
  --dp-duration-fast: 150ms;
  --dp-duration-normal: 250ms;
  --dp-duration-slow: 400ms;

  /* Easings */
  --dp-ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --dp-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dp-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Composites */
  --dp-transition-fast: var(--dp-duration-fast) var(--dp-ease-out);
  --dp-transition-normal: var(--dp-duration-normal) var(--dp-ease-out);
  --dp-transition-slow: var(--dp-duration-slow) var(--dp-ease-in-out);
}
```

---

### A.2 RECIPES - Component Classes

#### glass.css - Glass System Classes (~760 lines)

**Tint Variables:**
```css
/* Glass uses --glass-tint for per-element theming */
/* Default: var(--dp-hue), can be overridden inline */

/* Preset Hues */
--glass-hue-teal: 180;
--glass-hue-purple: 280;
--glass-hue-gold: 45;
--glass-hue-blue: 230;
--glass-hue-coral: 15;
--glass-hue-chat: var(--dp-hue);
--glass-hue-thinking: 280;
--glass-hue-success: 145;
--glass-hue-warning: 75;
--glass-hue-error: 25;
```

**Base Glass Classes:**
| Class | Description |
|-------|-------------|
| `.glass` | Standard translucent panel |
| `.glass-deep` | Darker, more saturated |
| `.glass-intense` | High contrast, bright borders |
| `.glass-glow` | Animated glowing border |
| `.glass-card` | Card container variant |
| `.glass-float` | Floating element (modals) |
| `.glass-bar` | Horizontal bar (topbar) |
| `.glass-bar-bottom` | Bottom bar (statusbar) |
| `.glass-sidebar` | Vertical sidebar |
| `.glass-button` | Interactive button |
| `.glass-input` | Form input |
| `.glass-modal` | Modal overlay |
| `.glass-scrim` | Background overlay |
| `.glass-error` | Error state glass |

**Tint Classes (add to glass):**
| Class | Hue |
|-------|-----|
| `.glass-tint-teal` | 180 |
| `.glass-tint-purple` | 280 |
| `.glass-tint-gold` | 45 |
| `.glass-tint-chat` | theme hue |
| `.glass-tint-thinking` | 280 |
| `.glass-tint-success` | 145 |
| `.glass-tint-warning` | 75 |
| `.glass-tint-error` | 25 |

**Layer Classes (z-index depth):**
| Class | Description |
|-------|-------------|
| `.glass-layer-0` | Base layer |
| `.glass-layer-1` | First elevation |
| `.glass-layer-2` | Second elevation |
| `.glass-layer-3` | Highest elevation |

**Effect Classes:**
| Class | Description |
|-------|-------------|
| `.glass-pulse` | Pulsing glow animation |
| `.glass-electric` | Electric blue pulse |
| `.glass-scanlines` | CRT scanline effect |
| `.glass-flicker` | Flicker animation |

#### metallic.css - Chrome Bevel System

**Tint Variable:**
```css
/* Metallic uses --metallic-tint for inner glow color */
```

**Classes:**
| Class | Description |
|-------|-------------|
| `.metallic` | Thick chrome bevel panel |
| `.metallic-ring` | Ring/badge shape |
| `.metallic-frame` | Photo/content frame |
| `.metallic-bar` | Horizontal chrome bar |
| `.metallic-button` | Chrome button |
| `.metallic-inset` | Recessed chrome element |
| `.metallic-tint-purple` | Purple inner glow preset |

#### buttons.css - Button Classes

| Class | Description |
|-------|-------------|
| `.btn` | Base button (not styled alone) |
| `.btn-primary` | Primary accent button |
| `.btn-secondary` | Secondary ghost button |
| `.btn-ghost` | Transparent hover button |
| `.btn-icon` | Icon-only button |
| `.btn-destructive` | Red danger button |

**Sizes (combine with base):**
| Class | Description |
|-------|-------------|
| `.btn-sm` | Small button |
| `.btn-lg` | Large button |

**States:**
- `:hover` - Brightness increase, glow
- `:active` - Press effect
- `:disabled` - Muted, no interaction
- `.loading` - Shows spinner

#### inputs.css - Form Elements

| Class | Description |
|-------|-------------|
| `.input` | Text input |
| `.textarea` | Multi-line input |
| `.select` | Dropdown select |
| `.checkbox` | Checkbox container |
| `.radio` | Radio container |
| `.form-group` | Field + label wrapper |
| `.form-label` | Label text |
| `.form-help` | Help text below |

**States:**
- `:focus` - Accent border, glow ring
- `.input-error` - Red border
- `.input-success` - Green border
- `:disabled` - Muted appearance

#### cards.css - Card Containers

| Class | Description |
|-------|-------------|
| `.card` | Standard card |
| `.card-header` | Card header section |
| `.card-body` | Card content |
| `.card-footer` | Card footer section |
| `.card-hover` | Adds hover effects |
| `.panel` | Larger panel variant |
| `.panel-header` | Panel header |
| `.panel-body` | Panel content |

#### badges.css - Badges & Dots

| Class | Description |
|-------|-------------|
| `.badge` | Base badge |
| `.badge-default` | Neutral badge |
| `.badge-success` | Green badge |
| `.badge-warning` | Orange badge |
| `.badge-error` | Red badge |
| `.badge-info` | Blue badge |
| `.badge-sm` | Small badge |
| `.badge-lg` | Large badge |
| `.status-dot` | Small status indicator |
| `.status-dot-success` | Green dot |
| `.status-dot-warning` | Orange dot |
| `.status-dot-error` | Red dot |
| `.status-dot-pulse` | Animated pulse dot |

#### backgrounds.css - Animated Backgrounds

| Class | Description |
|-------|-------------|
| `.bg-branded` | DevPulse branded bg |
| `.bg-devpulse` | Logo watermark bg |
| `.bg-circuit-glow` | Circuit board pattern |
| `.bg-pulse-line` | Horizontal pulse line |

---

### A.3 KEYFRAMES - Animations

#### glow.css
| Keyframe | Utility Class | Description |
|----------|---------------|-------------|
| `pulse-glow` | `.animate-pulse-glow` | Opacity pulse |
| `box-pulse-glow` | `.animate-box-pulse` | Box shadow pulse |
| `glass-glow-shift` | - | Gradient position shift |
| `breathe` | `.animate-breathe` | Scale + opacity |

#### motion.css
| Keyframe | Utility Class | Description |
|----------|---------------|-------------|
| `fade-in` | `.animate-fade-in` | Simple fade |
| `fade-in-up` | `.animate-fade-in-up` | Fade + slide up |
| `fade-in-down` | `.animate-fade-in-down` | Fade + slide down |
| `slide-in-left` | `.animate-slide-in-left` | Slide from left |
| `slide-in-right` | `.animate-slide-in-right` | Slide from right |
| `scale-in` | `.animate-scale-in` | Scale up + fade |

#### loading.css
| Keyframe | Utility Class | Description |
|----------|---------------|-------------|
| `spin` | `.animate-spin` | 360° rotation |
| `shimmer` | - | Shimmer sweep |
| `neural-bounce` | - | Bouncing dots |
| `loading-pulse` | `.animate-loading-pulse` | Shadow pulse |

**Components:**
| Class | Description |
|-------|-------------|
| `.spinner` | Rotating border spinner |
| `.spinner.lg` | Large spinner |
| `.shimmer` | Shimmer overlay (::after) |
| `.neural-loader` | 4-dot bounce loader |

---

### A.4 UTILITIES - Helper Classes

#### layout.css
| Class | Description |
|-------|-------------|
| `.flex` | display: flex |
| `.flex-col` | flex-direction: column |
| `.flex-row` | flex-direction: row |
| `.flex-wrap` | flex-wrap: wrap |
| `.flex-1` | flex: 1 |
| `.flex-none` | flex: none |
| `.items-start/center/end/stretch` | align-items |
| `.justify-start/center/end/between/around` | justify-content |
| `.gap-{1-8}` | gap spacing |
| `.grid` | display: grid |
| `.grid-cols-{2-4}` | grid columns |
| `.absolute/relative/fixed/sticky` | position |
| `.inset-0` | top/right/bottom/left: 0 |
| `.top/right/bottom/left-0` | position values |
| `.z-{0-50}` | z-index |
| `.w/h-full` | width/height: 100% |
| `.w/h-screen` | width/height: 100vh/vw |
| `.min/max-w/h-*` | size constraints |
| `.overflow-*` | overflow control |

#### text.css
| Class | Description |
|-------|-------------|
| `.text-xs/sm/base/lg/xl/2xl/3xl/4xl` | Font sizes |
| `.font-normal/medium/semibold/bold` | Font weights |
| `.text-left/center/right` | Alignment |
| `.text-primary/secondary/muted/dim` | Colors |
| `.text-accent/success/warning/error` | Semantic colors |
| `.text-gradient` | Gradient text effect |
| `.text-glow` | Glow text shadow |
| `.text-glass` | Glass text effect |
| `.truncate` | Ellipsis overflow |
| `.line-clamp-{2-3}` | Multi-line clamp |

#### hover.css
| Class | Description |
|-------|-------------|
| `.hover-lift` | translateY(-3px) on hover |
| `.hover-scale` | scale(1.02) on hover |
| `.hover-glow` | Glow shadow on hover |
| `.glass-hover` | Combined glass hover |
| `.focus-ring` | Focus outline ring |
| `.cursor-*` | Cursor types |
| `.select-none/text/all` | User select |
| `.pointer-events-none/auto` | Pointer events |

---

### A.5 COMPONENT-SPECIFIC CSS (Chat.svelte)

**Chat Window Classes:**
```css
.chat-window       /* Root container, sets --glass-tint from mode theme */
.chat-header       /* Header bar with glass-deep */
.header-left       /* Left section: icon, title, status */
.header-right      /* Right section: mode selector, dock buttons */
.maestro-icon      /* Animated icon, .ruminating spins */
.title             /* Title text */
.status-badge      /* Status indicator */
.status-ready      /* Green ready state */
.status-thinking   /* Pulsing thinking state */
.connection-dot    /* Connection indicator dot */
.connection-dot.connected/connecting/error

.mode-selector     /* Mode button group */
.mode-btn          /* Individual mode button, .active */

.social-bar        /* Channel tabs */
.channel-btn       /* Channel button, .active */
.channel-icon      /* Channel emoji */
.channel-name      /* Channel label */
.unread-badge      /* Unread count */

.task-section      /* Collapsible task panel */
.chat-area         /* Main message area */
.error-msg         /* Error message display */
.input-section     /* Input area */

.hud-bar           /* Bottom HUD */
.hud-main          /* HUD main row */
.hud-trigger       /* HUD expand button */
.hud-icon/label/arrow
.hud-quick         /* Quick action buttons */
.quick-btn         /* Quick button, .active, .recording */
.hud-expanded      /* Expanded HUD grid */
.hud-action        /* HUD action card */
.action-icon/label
```

**Local Keyframes in Chat:**
```css
@keyframes spin { from { rotate: 0deg } to { rotate: 360deg } }
@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.6 } }
```

---

### A.6 PRIMITIVES

#### reset.css
Modern CSS reset: box-sizing, margins, line-height, font smoothing, media defaults.

#### base.css
Element defaults:
- Body: font family, color, background
- Headings: font display, sizes
- Links: accent color
- Code: mono font
- Scrollbars: custom dark theme styling

---

### A.7 ENTRY POINT (index.css)

```css
/* Layer order declaration */
@layer tokens, primitives, recipes, utilities;

/* Import chain */
@import "./tokens/index.css";
@import "./primitives/index.css";
@import "./recipes/index.css";
@import "./keyframes/index.css";
@import "./utilities/index.css";
```

---

### A.8 DUPLICATION ANALYSIS

**Identified Duplications:**
1. `@keyframes spin` - Defined in both loading.css AND Chat.svelte
2. `@keyframes pulse` - Defined in glow.css AND Chat.svelte (different implementations)

**Consolidation Needed:**
- Move all keyframes to keyframes/*.css files only
- Component-specific CSS should only use utility classes
- `.chat-window` in Chat.svelte duplicates some `.glass` patterns

**Recommendation:**
Create these additional keyframes for Chat-specific animations:
- `pulse` (opacity pulse) → already in `glow.css` as `pulse-glow`
- Chat.svelte should use `.animate-pulse-glow` instead of local keyframe

---

*Created: 2026-01-12*
