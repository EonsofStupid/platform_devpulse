/**
 * @file Governance Controls Block Types
 * @layer blocks
 */

export interface GovernanceSlider {
	id: string;
	label: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
}

export interface GovernanceControlsProps {
	title?: string;
	sliders: GovernanceSlider[];
	onSliderChange?: (id: string, value: number) => void;
	class?: string;
}
