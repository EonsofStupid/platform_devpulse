/**
 * @file Sidebar — Seed Style Presets
 * @kind sidebar
 * @package @devpulse/coldlight
 *
 * Ref: CHAT-REFERENCE-01.png (left nav with ALERTNESS/ANOMALIES/PLANNING)
 */

export const sidebarPresets = {
	"neuro-panel": {
		"sidebar.root.background": "linear-gradient(180deg, rgba(10, 14, 23, 0.95) 0%, rgba(5, 8, 15, 0.98) 100%)",
		"sidebar.root.backdrop-blur": "12px",
		"sidebar.root.border.color": "rgba(0, 200, 200, 0.12)",
		"sidebar.root.shadow": "4px 0 16px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 200, 200, 0.2)",
		"sidebar.header.border.color": "rgba(0, 200, 200, 0.08)",
		"sidebar.header.color": "#e0f7fa",
		"sidebar.footer.border.color": "rgba(0, 200, 200, 0.08)",
		"sidebar.item.color": "#64748b",
		"sidebar.item.color.hover": "#94a3b8",
		"sidebar.item.color.active": "#e0f7fa",
		"sidebar.item.background.hover": "rgba(0, 200, 200, 0.04)",
		"sidebar.item.background.active": "rgba(0, 200, 200, 0.08)",
		"sidebar.item.indicator.color": "#00c8c8",
		"sidebar.item.indicator.shadow": "0 0 6px rgba(0, 200, 200, 0.4)",
	},
	"glass-panel": {
		"sidebar.root.background": "rgba(255, 255, 255, 0.02)",
		"sidebar.root.backdrop-blur": "16px",
		"sidebar.root.border.color": "rgba(255, 255, 255, 0.06)",
		"sidebar.root.shadow": "2px 0 8px rgba(0, 0, 0, 0.2)",
		"sidebar.header.border.color": "rgba(255, 255, 255, 0.04)",
		"sidebar.header.color": "#e2e8f0",
		"sidebar.footer.border.color": "rgba(255, 255, 255, 0.04)",
		"sidebar.item.color": "#64748b",
		"sidebar.item.color.hover": "#e2e8f0",
		"sidebar.item.color.active": "#e2e8f0",
		"sidebar.item.background.hover": "rgba(255, 255, 255, 0.03)",
		"sidebar.item.background.active": "rgba(255, 255, 255, 0.05)",
		"sidebar.item.indicator.color": "#e2e8f0",
		"sidebar.item.indicator.shadow": "none",
	},
	"flat-panel": {
		"sidebar.root.background": "#0a0e17",
		"sidebar.root.backdrop-blur": "0px",
		"sidebar.root.border.color": "rgba(255, 255, 255, 0.06)",
		"sidebar.root.shadow": "none",
		"sidebar.header.border.color": "rgba(255, 255, 255, 0.04)",
		"sidebar.header.color": "#e2e8f0",
		"sidebar.footer.border.color": "rgba(255, 255, 255, 0.04)",
		"sidebar.item.color": "#475569",
		"sidebar.item.color.hover": "#94a3b8",
		"sidebar.item.color.active": "#e2e8f0",
		"sidebar.item.background.hover": "rgba(255, 255, 255, 0.02)",
		"sidebar.item.background.active": "rgba(255, 255, 255, 0.04)",
		"sidebar.item.indicator.color": "#e2e8f0",
		"sidebar.item.indicator.shadow": "none",
	},
} as const;
