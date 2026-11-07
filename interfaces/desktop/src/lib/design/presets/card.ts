/**
 * @file Card — Seed Style Presets
 * @kind card
 * @package @devpulse/coldlight
 *
 * Dashboard panels, chat containers, data widgets.
 * Ref: DASHBOARD-REFERENCE-01.png, CHAT-REFERENCE-01.png
 */

export const cardPresets = {
	"neuro-elevated": {
		"card.root.background": "linear-gradient(135deg, rgba(10, 14, 23, 0.85) 0%, rgba(15, 23, 36, 0.9) 100%)",
		"card.root.backdrop-blur": "12px",
		"card.root.border.color": "rgba(0, 200, 200, 0.2)",
		"card.root.border.width": "1px",
		"card.root.border-radius": "16px",
		"card.root.shadow": "0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.15)",
		"card.root.glow": "0 0 1px rgba(0, 200, 200, 0.3)",
	},
	"neuro-inset": {
		"card.root.background": "rgba(5, 8, 15, 0.7)",
		"card.root.backdrop-blur": "8px",
		"card.root.border.color": "rgba(0, 200, 200, 0.12)",
		"card.root.border.width": "1px",
		"card.root.border-radius": "12px",
		"card.root.shadow": "inset 0 2px 6px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.03)",
	},
	"neuro-data-widget": {
		"card.root.background": "linear-gradient(180deg, rgba(10, 14, 23, 0.9) 0%, rgba(8, 12, 20, 0.95) 100%)",
		"card.root.backdrop-blur": "16px",
		"card.root.border.color": "rgba(0, 200, 200, 0.15)",
		"card.root.border.width": "1px",
		"card.root.border-radius": "16px",
		"card.root.shadow": "0 4px 24px rgba(0, 0, 0, 0.6), 0 1px 4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(0, 200, 200, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
		"card.header.border.color": "rgba(0, 200, 200, 0.08)",
		"card.header.color": "#e0f7fa",
	},
	"glass-panel": {
		"card.root.background": "rgba(255, 255, 255, 0.03)",
		"card.root.backdrop-blur": "16px",
		"card.root.border.color": "rgba(255, 255, 255, 0.08)",
		"card.root.border.width": "1px",
		"card.root.border-radius": "16px",
		"card.root.shadow": "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
	},
	"glass-teal": {
		"card.root.background": "linear-gradient(135deg, rgba(0, 200, 200, 0.04) 0%, rgba(0, 200, 200, 0.02) 100%)",
		"card.root.backdrop-blur": "12px",
		"card.root.border.color": "rgba(0, 200, 200, 0.18)",
		"card.root.border.width": "1px",
		"card.root.border-radius": "16px",
		"card.root.shadow": "0 4px 20px rgba(0, 0, 0, 0.4), 0 0 12px rgba(0, 200, 200, 0.08), inset 0 1px 0 rgba(0, 200, 200, 0.06)",
	},
	"flat-outlined": {
		"card.root.background": "rgba(15, 23, 36, 0.6)",
		"card.root.backdrop-blur": "0px",
		"card.root.border.color": "rgba(255, 255, 255, 0.06)",
		"card.root.border.width": "1px",
		"card.root.border-radius": "8px",
		"card.root.shadow": "none",
	},
	"matte-solid": {
		"card.root.background": "#0f1724",
		"card.root.backdrop-blur": "0px",
		"card.root.border.color": "rgba(255, 255, 255, 0.08)",
		"card.root.border.width": "1px",
		"card.root.border-radius": "12px",
		"card.root.shadow": "0 2px 8px rgba(0, 0, 0, 0.4)",
	},
} as const;
