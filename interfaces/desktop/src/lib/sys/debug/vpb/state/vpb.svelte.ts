/**
 * VPB State Management
 * Runes-powered state for VPB modes and position.
 */

export type VPBMode = 'docked' | 'floating' | 'minimized';

interface Position {
  x: number;
  y: number;
}

class VPBManager {
  /** Current display mode */
  mode = $state<VPBMode>('docked');
  
  /** Position for floating mode */
  position = $state<Position>({ x: 0, y: 0 });
  
  /** Scan mode active */
  scanActive = $state(false);
  
  /** Scan mode paused (can browse without overlay) */
  scanPaused = $state(false);
  
  // ─────────────────────────────────────────────────────────────
  // Mode Methods
  // ─────────────────────────────────────────────────────────────
  
  /** Switch to docked mode (bottom-right) */
  dock(): void {
    this.mode = 'docked';
  }
  
  /** Switch to floating mode (draggable) */
  float(): void {
    this.mode = 'floating';
  }
  
  /** Switch to minimized mode (V icon only) */
  minimize(): void {
    this.mode = 'minimized';
  }
  
  /** Update floating position */
  setPosition(x: number, y: number): void {
    this.position = { x, y };
  }
  
  // ─────────────────────────────────────────────────────────────
  // Scan Methods
  // ─────────────────────────────────────────────────────────────
  
  /** Toggle scan mode on/off */
  toggleScan(): void {
    this.scanActive = !this.scanActive;
    if (this.scanActive) {
      this.scanPaused = false;
    }
  }
  
  /** Start scan mode */
  startScan(): void {
    this.scanActive = true;
    this.scanPaused = false;
  }
  
  /** Stop scan mode (graceful) */
  stopScan(): void {
    this.scanActive = false;
    this.scanPaused = false;
  }
  
  /** Pause scan (overlay hidden, can browse) */
  pauseScan(): void {
    this.scanPaused = true;
  }
  
  /** Resume scan from pause */
  resumeScan(): void {
    this.scanPaused = false;
  }
}

export const vpb = new VPBManager();
