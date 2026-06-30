# SPRINT: HOME (DevPulse - The Hub)
> **Goal**: Build the Main Dashboard that orchestrates the entire platform.
> **Philosophy**: "The Viewport Never Moves." (Seamless Content Scroll).
> **Input**: Keyboard & Mouse Carousel Selection.
> **Parent**: `lib/domains/app/devpulse`

## 1. The Layout (Deep Glass Shell)
*   **TopBar**: Global Status, Notification Center.
*   **StatusBar**: System Metrics, Agent Status.
*   **Main Viewport**: **Fixed Container**. Content seamlessly scrolls *between* bars.
*   **Glassmorphism**: Teal/Purple/Glass aesthetic (Global Variables).

## 2. The Mechanics (Navigation)
*   **The Carousel**: A unique component to select Domains/Projects.
    *   Input: Mouse Scroll & Keyboard Arrows.
    *   Items: `OverMind` (Lab), `Projects` (Work), `Settings` (User).
    *   Transition: Seamless fade/slide into the Main Viewport.

## 3. Domain: User
*   **Status**: Exists as `lib/domains/app/user`.
*   **Integration**: Accessed via Carousel or TopBar Profile.
*   **Content**: Profile, Settings, Identity.

## 4. Directory Structure (Strict Hyper-Modular)
`interfaces/desktop/src/lib/domains/app/devpulse/`
*   `services/`: Navigation State, Carousel Logic.
*   `components/`:
    *   `Carousel.svelte` (The Core Nav).
    *   `TopBar.svelte`.
    *   `StatusBar.svelte`.
    *   `Viewport.svelte` (The Content Container).
*   `stores/`: UI Stats (Active Slide, Scroll Position).
*   `pages/`: `HomeDashboard.svelte`.
*   `utils/`: Animation helpers.

## 5. Execution Order
1.  **Scaffold**: Ensure `devpulse` has all 5 folders. (Done).
2.  **Global CSS**: Define the Glass Variables (variables.css).
3.  **Components**: Build `TopBar`, `StatusBar`, `Viewport`, `Carousel`.
4.  **Dashboard**: Assemble `HomeDashboard.svelte`.
5.  **Wiring**: Wiring into `App.svelte` (Router).
