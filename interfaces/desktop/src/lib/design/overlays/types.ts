/**
 * @file Overlay Types — sprite animation system for chibi 8-bit minions.
 *
 * All animation is CSS `steps()` — zero JavaScript animation.
 * Sprite sheets are .webp for compression.
 * `image-rendering: pixelated` for crisp 8-bit scaling.
 */

/** Configuration for a minion's sprite sheets. */
export interface MinionSpriteConfig {
	/** Minion identifier (matches backend minion names). */
	minionId: string;
	/** Display name. */
	label: string;
	/** Sprite sheets per animation state. Paths relative to /static/sprites/minions/ */
	sheets: {
		idle: string;
		walking: string;
		working: string;
		escalated: string;
	};
	/** Width of a single frame in pixels. */
	frameWidth: number;
	/** Height of a single frame in pixels. */
	frameHeight: number;
	/** Number of frames per animation state. */
	frameCounts: {
		idle: number;
		walking: number;
		working: number;
		escalated: number;
	};
}

/** Runtime state of an active minion on screen. */
export interface ActiveMinion {
	/** Minion identifier. */
	minionId: string;
	/** Current animation state. */
	state: MinionAnimationState;
	/** Current X position in viewport (px). */
	x: number;
	/** Current Y position in viewport (px). */
	y: number;
	/** Target X for walking. */
	targetX: number;
	/** Target Y for walking. */
	targetY: number;
	/** Whether the sprite faces left (flipped). */
	flipped: boolean;
}

export type MinionAnimationState = "idle" | "walking" | "working" | "escalated";

/** Default sprite configs — placeholder until Jesse's art is ready. */
export const DEFAULT_SPRITE_CONFIGS: MinionSpriteConfig[] = [
	sprite("guardian", "Guardian", "🛡️"),
	sprite("enforcer", "Enforcer", "⚖️"),
	sprite("diary", "Diary", "📔"),
	sprite("psych", "Psych", "🧠"),
	sprite("teacher", "Teacher", "📚"),
	sprite("scribe", "Scribe", "✍️"),
	sprite("vision", "Vision", "👁️"),
	sprite("researcher", "Researcher", "🔍"),
];

/** Helper to create a placeholder sprite config. */
function sprite(id: string, label: string, _icon: string): MinionSpriteConfig {
	return {
		minionId: id,
		label,
		sheets: {
			idle: `${id}-idle.webp`,
			walking: `${id}-walk.webp`,
			working: `${id}-work.webp`,
			escalated: `${id}-escalate.webp`,
		},
		frameWidth: 32,
		frameHeight: 32,
		frameCounts: { idle: 4, walking: 8, working: 6, escalated: 4 },
	};
}
