# GLASS SHELL SPECIFICATION (The Visual Core)
> **Goal**: A "Deep Glass" container that holds the entire platform.
> **Visuals**: Dynamic, Performance-Optimized Backgrounds (SVG/Canvas).
> **Layout**: Flexbox (Macro) + CSS Grid (Micro).
> **Strategy**: **Hyper-Modular First** (WET over DRY).
> **Rule**: Do NOT create `src/lib/shared` or `src/lib/common` yet. Build everything inside the Domain.

## 1. The Frame Architecture (`Frame.svelte`)
The Frame is the **Single Truth** of the UI. It never unmounts.

```svelte
<!-- Macro Layout: Flexbox Column (100vh) -->
<div class="app-frame">
  <!-- 0. Dynamic Background Layer (Z-Index -1) -->
  <DynamicBackground {mode} /> 

  <!-- 1. TopBar (Fixed Height) -->
  <header class="glass-shelf">
     <TopBar />
  </header>

  <!-- 2. Main Body (Flex Row: Sidebar + Content) -->
  <main class="main-body">
     <sidebar class="glass-panel">
         <LeftSidebar />
     </sidebar>
     
     <!-- The Viewport (Scrollable) -->
     <section class="viewport">
         <slot /> 
     </section>
  </main>

  <!-- 3. StatusBar (Fixed Height) -->
  <footer class="glass-shelf">
     <StatusBar />
  </footer>
</div>
```

## 2. CSS Strategy: The Hybrid
> **Question**: Does Flex+Grid make sense?
> **Answer**: **YES**. It is the Industry Standard for complex Dashboard Apps.

*   **Flexbox**: Used for the **Macro Layout** (The "Flow").
    *   `App Frame`: Flex Column (Top -> Body -> Bottom).
    *   `Main Body`: Flex Row (Sidebar -> Content).
    *   *Why?* Flex is superior for 1D flows where one element (Content) consumes remaining space.
*   **CSS Grid**: Used for the **Micro Layouts** (The "Placement").
    *   `TopBar`: Grid (Logo | Search | Profile) - Precise control of 3 zones.
    *   `Dashboards`: Grid (Cards, Widgets) - 2D positioning.
    *   *Why?* Grid excels at 2D alignment and precise gap control.

## 3. Dynamic Background System
*   **Component**: `DynamicBackground.svelte`
*   **Logic**: Listens to `$appState.domain` (e.g., 'wiredfront', 'overmind').
*   **Transitions**: Smooth CSS/SVG interpolations between states.
    *   **OverMind**: Bioluminescent Teal/Purple (Canvas/WebGL or Heavy SVG).
    *   **Home**: Clean Glass (Subtle Gradients).
    *   **WiredFront**: High Contrast / Overlay Mode.

## 4. Execution Plan
1.  **Refactor Frame**: Update `Frame.svelte` to match this structure.
2.  **Global CSS**: Define `.glass-shelf`, `.glass-panel`, `.viewport`.
3.  **Background System**: Scaffold `DynamicBackground.svelte` and the Store.
