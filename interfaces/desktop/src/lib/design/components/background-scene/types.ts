import type { Intensity, Motion, Palette, Speed, Variation } from "./BackgroundScene.svelte";

export interface BackgroundSceneProps {
	variation?: Variation;
	palette?: Palette;
	speed?: Speed;
	intensity?: Intensity;
	motion?: Motion;
	class?: string;
}
