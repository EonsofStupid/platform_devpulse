/**
 * @file src/lib/sys/debug/vpb/state/vpb.state.svelte.ts
 * @module @devpulse/sys/debug/vpb/state
 * @description Global State Manager for the Visual Page Builder.
 * Handles window presence, docking modes, and global domain switching.
 * @since 1.0.0
 */
import type { VPBMode, VPBDomain, XYPosition, DragState } from "../types";

class VPBStateManager {
    // --------------------------------------------------------
    // STATE (Runes)
    // --------------------------------------------------------
    
    /** Current Window Mode (Docked vs Floating) */
    mode = $state<VPBMode>('docked');
    
    /** Current Functional Domain (Inspect vs Build) */
    domain = $state<VPBDomain>('inspector');
    
    /** Visibility of the Shell */
    isOpen = $state(true);
    
    /** Floating Window Position */
    position = $state<XYPosition>({ x: 20, y: 20 });
    
    /** Global Drag State (for Shell DnD) */
    isDragging = $state(false);
    
    /** Is the Inspector currently scanning? */
    scanActive = $state(false);


    // --------------------------------------------------------
    // ACTIONS
    // --------------------------------------------------------

    setMode(mode: VPBMode) {
        this.mode = mode;
    }

    setDomain(domain: VPBDomain) {
        this.domain = domain;
    }

    toggleOpen() {
        this.isOpen = !this.isOpen;
    }

    // Drag Logic
    startDrag(e: MouseEvent) {
        if (this.mode !== 'floating') return;
        this.isDragging = true;
        
        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = this.position.x;
        const initialY = this.position.y;

        const onMove = (evt: MouseEvent) => {
            const dx = evt.clientX - startX;
            const dy = evt.clientY - startY;
            this.position = { x: initialX + dx, y: initialY + dy };
        };

        const onUp = () => {
            this.isDragging = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }
}

// Singleton Instance
export const vpb = new VPBStateManager();
