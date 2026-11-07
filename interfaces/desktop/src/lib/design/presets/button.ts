/**
 * @file Button — Seed Style Presets
 * @kind button
 * @package @devpulse/coldlight
 *
 * Ref: DASHBOARD-REFERENCE-01.png (action buttons), CHAT-REFERENCE-01.png (Voice Active)
 */

export const buttonPresets = {
	"neuro-elevated": {
		"button.root.background.default": "linear-gradient(180deg, rgba(15, 23, 36, 0.8) 0%, rgba(10, 14, 23, 0.9) 100%)",
		"button.root.background.hover": "linear-gradient(180deg, rgba(20, 30, 45, 0.85) 0%, rgba(15, 23, 36, 0.95) 100%)",
		"button.root.backdrop-blur": "8px",
		"button.root.border.color": "rgba(0, 200, 200, 0.25)",
		"button.root.border-radius": "12px",
		"button.root.shadow": "0 4px 16px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.15)",
		"button.root.shadow.hover": "0 6px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(0, 200, 200, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
		"button.root.color": "#e0f7fa",
		"button.root.transition": "all 200ms ease-out",
	},
	"neuro-glow-teal": {
		"button.root.background.default": "rgba(0, 200, 200, 0.12)",
		"button.root.background.hover": "rgba(0, 200, 200, 0.18)",
		"button.root.border.color": "rgba(0, 200, 200, 0.4)",
		"button.root.border-radius": "12px",
		"button.root.shadow": "0 0 12px rgba(0, 200, 200, 0.2), 0 0 24px rgba(0, 200, 200, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(0, 200, 200, 0.1)",
		"button.root.shadow.hover": "0 0 16px rgba(0, 200, 200, 0.35), 0 0 32px rgba(0, 200, 200, 0.12), 0 4px 12px rgba(0, 0, 0, 0.4)",
		"button.root.color": "#00c8c8",
		"button.root.transition": "all 200ms ease-out",
	},
	"neuro-glow-red": {
		"button.root.background.default": "rgba(239, 68, 68, 0.12)",
		"button.root.background.hover": "rgba(239, 68, 68, 0.18)",
		"button.root.border.color": "rgba(239, 68, 68, 0.4)",
		"button.root.border-radius": "12px",
		"button.root.shadow": "0 0 12px rgba(239, 68, 68, 0.2), 0 0 24px rgba(239, 68, 68, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)",
		"button.root.color": "#ef4444",
		"button.root.transition": "all 200ms ease-out",
	},
	"neuro-glow-purple": {
		"button.root.background.default": "rgba(167, 139, 250, 0.12)",
		"button.root.background.hover": "rgba(167, 139, 250, 0.18)",
		"button.root.border.color": "rgba(167, 139, 250, 0.4)",
		"button.root.border-radius": "12px",
		"button.root.shadow": "0 0 12px rgba(167, 139, 250, 0.2), 0 0 24px rgba(167, 139, 250, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)",
		"button.root.color": "#a78bfa",
		"button.root.transition": "all 200ms ease-out",
	},
	"glass-deep": {
		"button.root.background.default": "rgba(255, 255, 255, 0.04)",
		"button.root.background.hover": "rgba(255, 255, 255, 0.08)",
		"button.root.backdrop-blur": "8px",
		"button.root.border.color": "rgba(255, 255, 255, 0.1)",
		"button.root.border-radius": "10px",
		"button.root.shadow": "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
		"button.root.color": "#e2e8f0",
		"button.root.transition": "all 150ms ease-out",
	},
	"flat-minimal": {
		"button.root.background.default": "transparent",
		"button.root.background.hover": "rgba(255, 255, 255, 0.04)",
		"button.root.border.color": "rgba(255, 255, 255, 0.06)",
		"button.root.border-radius": "8px",
		"button.root.shadow": "none",
		"button.root.color": "#94a3b8",
		"button.root.transition": "all 150ms ease-out",
	},
	"matte-solid": {
		"button.root.background.default": "#1e293b",
		"button.root.background.hover": "#334155",
		"button.root.border.color": "rgba(255, 255, 255, 0.08)",
		"button.root.border-radius": "10px",
		"button.root.shadow": "0 1px 3px rgba(0, 0, 0, 0.3)",
		"button.root.color": "#e2e8f0",
		"button.root.transition": "all 150ms ease-out",
	},
} as const;
