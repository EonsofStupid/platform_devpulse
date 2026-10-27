import type { SurfaceFamily } from "@devpulse/coldlight/renderforge";

export interface ComponentPreviewProps {
	family: SurfaceFamily;
	selected: boolean;
	onSelect: () => void;
	onAction: (message: string) => void;
}
