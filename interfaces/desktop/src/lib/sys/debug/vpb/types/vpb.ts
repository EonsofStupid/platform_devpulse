export type VPBTab = "inspector" | "builder";

export interface VPBState {
    isOpen: boolean;
    activeTab: VPBTab;
    position: { x: number; y: number };
}
