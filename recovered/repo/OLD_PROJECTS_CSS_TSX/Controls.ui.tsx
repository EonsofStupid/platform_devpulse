/**
 * @fileoverview Controls Component - Scan Mode Controls
 * @module devpulse-ui/controls/Controls
 * 
 * Floating controls for starting/pausing/stopping scan mode
 * and toggling the panel. Includes DevPulse branding, draggable positioning,
 * and glossary tooltips.
 */

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useAtom } from "jotai";
import { scanModeAtom, panelOpenAtom, cursorAtom, targetAtom, unlockedAtom } from "../state/overlay.atoms";
import { resolveTargetAt } from "../scanner/resolveTargetAt.utl";
import { getDevPulseRPC } from "../bridge/devpulse.rpc.svc";
import { GlossaryTooltip } from "../components/GlossaryTooltip.ui";
import type { ConnectionState } from "../bridge/wsClient.utl";

const STORAGE_KEY_POSITION = "devpulse_controls_position";
const STORAGE_KEY_LOCKED = "devpulse_controls_locked";

export function Controls() {
  const [mode, setMode] = useAtom(scanModeAtom);
  const [, setCursor] = useAtom(cursorAtom);
  const [, setTarget] = useAtom(targetAtom);
  const [open, setOpen] = useAtom(panelOpenAtom);
  const [unlocked, setUnlocked] = useAtom(unlockedAtom);
  const [isDragging, setIsDragging] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    // Load saved position from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_POSITION);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { x: parsed.x ?? 16, y: parsed.y ?? 16 };
        } catch {
          // Invalid JSON, use default
        }
      }
    }
    return { x: 16, y: 16 }; // Default top-left
  });
  const controlsRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (mode === "idle") {
      console.log('[DevPulse] Scan mode: IDLE - mouse tracking disabled');
      return;
    }
    
    console.log(`[DevPulse] Scan mode: ${mode.toUpperCase()} - enabling mouse tracking`);
    
    const onMove = async (e: MouseEvent) => {
      if (mode !== "scanning" && mode !== "paused") return;
      
      setCursor({ x: e.clientX, y: e.clientY });
      
      // Resolve target from DOM
      const r = resolveTargetAt(e.clientX, e.clientY);
      
      // Resolve governance through bridge if we have file/selector
      if (r.file || r.selector) {
        try {
          const resolved = await getDevPulseRPC().resolveTarget({
            file: r.file,
            selector: r.selector,
            zone: r.zone,
            kind: r.kind,
          }) as {
            zone?: string;
            kind?: string;
            file?: string;
            selector?: string;
            context?: {
              type: "devpulse" | "platform" | "unknown";
              profile: string;
              relativePath: string;
            };
            governance?: {
              profile: string;
              hasProfile: boolean;
              profilePath?: string;
            };
          };
          
          // Merge DOM resolution with bridge governance
          setTarget({
            el: r.el,
            zone: r.zone || resolved.zone,
            kind: r.kind || resolved.kind,
            file: r.file || resolved.file,
            selector: r.selector || resolved.selector,
            context: resolved.context,
            governance: resolved.governance,
          });
        } catch (error) {
          // Fallback to DOM-only if bridge fails
          console.warn('[DevPulse] Bridge resolution failed, using DOM-only:', error);
          setTarget({ el: r.el, zone: r.zone, kind: r.kind, file: r.file, selector: r.selector });
        }
      } else {
        // No file/selector, just DOM info
        setTarget({ el: r.el, zone: r.zone, kind: r.kind, file: r.file, selector: r.selector });
      }
    };
    
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      console.log('[DevPulse] Scan mode: mouse tracking disabled');
    };
  }, [mode, setCursor, setTarget]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("devpulse:open", onOpen);
    return () => window.removeEventListener("devpulse:open", onOpen);
  }, [setOpen]);

  // Monitor WebSocket connection status
  useEffect(() => {
    const rpc = getDevPulseRPC();
    const wsClient = rpc.wsClient;
    
    // Get initial state
    setConnectionState(wsClient.getState());
    
    // Listen for state changes
    const unsubscribe = wsClient.on('stateChange', (state) => {
      setConnectionState(state as ConnectionState);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Load locked state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_LOCKED);
      if (saved === "false") {
        setUnlocked(true);
      }
    }
  }, [setUnlocked]);

  // Save position to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && position) {
      localStorage.setItem(STORAGE_KEY_POSITION, JSON.stringify(position));
    }
  }, [position]);

  // Dragging handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!unlocked || !controlsRef.current) return;
    if ((e.target as HTMLElement).closest('.dp-ctrl')) return; // Don't drag when clicking buttons
    
    setIsDragging(true);
    const rect = controlsRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    e.preventDefault();
  }, [unlocked]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !controlsRef.current) return;
      
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - controlsRef.current.offsetWidth;
      const maxY = window.innerHeight - controlsRef.current.offsetHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const toggleLock = useCallback(() => {
    const newUnlocked = !unlocked;
    setUnlocked(newUnlocked);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_LOCKED, String(!newUnlocked));
    }
  }, [unlocked, setUnlocked]);

  const scanAll = useCallback(async () => {
    console.log('[DevPulse] 🔍 Starting full page scan...');
    try {
      const result = await getDevPulseRPC().scanAll();
      console.log('[DevPulse] ✅ Scan complete:', result);
      // Could set a state to show all scanned elements
    } catch (error) {
      console.error('[DevPulse] ❌ Scan all failed:', error);
    }
  }, []);

  const scanIndicatorClass = mode === "scanning" ? "scanning" : mode === "paused" ? "paused" : "";

  return (
    <div
      ref={controlsRef}
      className={`dp-controls ${unlocked ? "unlocked" : ""} ${isDragging ? "dragging" : ""}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* DevPulse Branding */}
      <div className="dp-brand-logo">DevPulse</div>
      
      {/* Connection Status Indicator */}
      <div 
        className={`dp-connection-indicator ${connectionState === 'connected' ? 'connected' : connectionState === 'connecting' ? 'connecting' : 'disconnected'}`}
        title={`WebSocket: ${connectionState}`}
        aria-label={`Connection status: ${connectionState}`}
      >
        {connectionState === 'connected' ? '●' : connectionState === 'connecting' ? '○' : '○'}
      </div>
      
      {/* Scan Mode Indicator */}
      {mode !== "idle" && (
        <div className={`dp-scan-indicator ${scanIndicatorClass}`} aria-label={`Scan mode: ${mode}`} />
      )}
      
      {/* Lock/Unlock Button */}
      <button
        className="dp-ctrl dp-lock-btn"
        onClick={toggleLock}
        title={unlocked ? "Lock position" : "Unlock to move"}
        aria-label={unlocked ? "Lock controls position" : "Unlock controls to reposition"}
      >
        {unlocked ? "🔓" : "🔒"}
      </button>

      {/* Control Buttons */}
      {mode !== "scanning" && (
        <GlossaryTooltip term="scan mode">
          <button
            className="dp-ctrl dp-start"
            onClick={() => {
              console.log('[DevPulse] ▶ Starting scan mode');
              setMode("scanning");
            }}
            title="Start scan mode"
            aria-label="Start scan mode"
          >
            ▶
          </button>
        </GlossaryTooltip>
      )}
      {mode === "scanning" && (
        <GlossaryTooltip term="scan mode">
          <button
            className="dp-ctrl dp-pause"
            onClick={() => {
              console.log('[DevPulse] ⏸ Pausing scan mode');
              setMode("paused");
            }}
            title="Pause scan"
            aria-label="Pause scan mode"
          >
            ⏸
          </button>
        </GlossaryTooltip>
      )}
      <GlossaryTooltip term="scan mode">
        <button
          className="dp-ctrl dp-stop"
          onClick={() => {
            console.log('[DevPulse] ■ Stopping scan mode');
            setMode("idle");
            setTarget(null);
            setCursor(null);
          }}
          title="Stop scan"
          aria-label="Stop scan mode"
        >
          ■
        </button>
      </GlossaryTooltip>
      <GlossaryTooltip term="scan mode">
        <button
          className="dp-ctrl dp-scan-all"
          onClick={scanAll}
          title="Scan all elements"
          aria-label="Scan all elements for governance violations"
        >
          🔍
        </button>
      </GlossaryTooltip>
      <GlossaryTooltip term="panel">
        <button
          className="dp-ctrl dp-panel-btn"
          onClick={() => setOpen(!open)}
          title="Toggle panel"
          aria-label="Toggle DevPulse panel"
        >
          ☰
        </button>
      </GlossaryTooltip>
    </div>
  );
}

