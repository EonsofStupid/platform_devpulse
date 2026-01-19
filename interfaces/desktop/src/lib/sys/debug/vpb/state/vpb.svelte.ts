import type { VPBState, VPBTab } from "../types/vpb";

class VPBStore {
    isOpen = $state(false);
    activeTab = $state<VPBTab>("inspector");
    
    toggle() {
        this.isOpen = !this.isOpen;
    }

    setTab(tab: VPBTab) {
        this.activeTab = tab;
    }
}

export const vpb = new VPBStore();
