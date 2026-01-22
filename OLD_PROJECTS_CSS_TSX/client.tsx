/**
 * @fileoverview DevPulse UI Client - Entry Point
 * @module devpulse-ui/client
 *
 * Mounts shadow DOM and React app for DevPulse overlay.
 * Initializes WebSocket bridge.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { Provider as JotaiProvider } from "jotai";
import { Controls } from "./controls/Controls.ui";
import { GradientHighlight } from "./overlays/GradientHighlight.ui";
import { QuickCard } from "./overlays/QuickCard.ui";
import { WelcomePopup } from "./overlays/WelcomePopup.ui";
import { Panel } from "./panels/Panel.ui";
import overlayCss from "./styles/overlay.css?inline";

export function mountDevPulse(opts: { wsUrl: string; topbarHook?: boolean }) {
  if (!import.meta.env.DEV) return;
  if (typeof window === "undefined") return;
  interface DevPulseWindow extends Window {
    __DEVPULSE_DISABLED__?: boolean;
    __DEVPULSE_WS_URL?: string;
    __DEVPULSE_OPEN?: () => void;
  }
  const win = window as DevPulseWindow;
  if (win.__DEVPULSE_DISABLED__) return;
  if (document.getElementById("__devpulse_host")) return;

  win.__DEVPULSE_WS_URL = opts.wsUrl;

  const host = document.createElement("div");
  host.id = "__devpulse_host";
  host.style.cssText = "all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  
  // Inject overlay CSS directly into shadow DOM
  // Using overlay.css which contains all necessary styles without Tailwind
  try {
    // Check if overlayCss is a string (Vite inlines CSS imports)
    if (typeof overlayCss === 'string' && overlayCss.length > 0) {
      style.textContent = overlayCss;
      shadow.appendChild(style);
      console.log('[DevPulse] ✅ CSS injected successfully into Shadow DOM, length:', overlayCss.length);
    } else {
      // Fallback: try to fetch CSS directly
      console.warn('[DevPulse] ⚠️ CSS not inlined, attempting direct fetch. overlayCss type:', typeof overlayCss);
      const cssUrl = new URL('../styles/overlay.css', import.meta.url).href;
      fetch(cssUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then(cssText => {
          style.textContent = cssText;
          shadow.appendChild(style);
          console.log('[DevPulse] ✅ CSS loaded via fetch');
        })
        .catch(err => {
          console.error('[DevPulse] ❌ Failed to load CSS:', err);
          // Last resort: inject minimal critical styles
          style.textContent = `
            :host { --dp-fg: #F5F5F7; --dp-bg-dark: #0F1419; --dp-glass: hsla(217, 91%, 25%, 0.7); }
            .dp-controls { position: fixed; left: 16px; top: 16px; display: flex; gap: 8px; pointer-events: auto; 
              background: var(--dp-glass); backdrop-filter: blur(8px); padding: 8px 12px; border-radius: 999px; 
              box-shadow: 0 0 0 1px rgba(51, 153, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.16); z-index: 2147483647; }
            .dp-ctrl { all: unset; cursor: pointer; width: 34px; height: 34px; display: grid; place-items: center; 
              border-radius: 6px; color: var(--dp-fg); transition: all 0.2s ease; }
            .dp-brand-logo { display: inline-flex; align-items: center; font-weight: 700; font-size: 13px; 
              letter-spacing: 0.05em; color: var(--dp-fg); text-transform: uppercase; }
          `;
          shadow.appendChild(style);
          console.warn('[DevPulse] ⚠️ Using fallback minimal styles');
        });
    }
  } catch (error) {
    console.error('[DevPulse] ❌ Error injecting CSS:', error);
    // Inject minimal fallback styles
    style.textContent = `
      :host { --dp-fg: #F5F5F7; --dp-bg-dark: #0F1419; }
      .dp-controls { position: fixed; left: 16px; top: 16px; display: flex; gap: 8px; background: rgba(26, 31, 44, 0.9); 
        padding: 8px; border-radius: 8px; z-index: 2147483647; }
    `;
    shadow.appendChild(style);
  }
  
  // Ensure Shadow DOM isolation - prevent style leakage
  console.log('[DevPulse] ✅ Shadow DOM created with mode: open');

  const app = document.createElement("div");
  app.id = "__devpulse_app";
  shadow.appendChild(app);

  const root = createRoot(app);
  root.render(
    <React.StrictMode>
      <JotaiProvider>
        <WelcomePopup />
        <GradientHighlight />
        <QuickCard />
        <Controls />
        <Panel />
      </JotaiProvider>
      </React.StrictMode>
  );

  if (opts.topbarHook) {
    win.__DEVPULSE_OPEN = () => window.dispatchEvent(new CustomEvent("devpulse:open"));
  }
  
  // Welcome popup flag is set by Vite plugin script injection
}

