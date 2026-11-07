/**
 * @file Form + FormField — Seed Style Presets
 * @kind form, form-field
 * @package @devpulse/coldlight
 */

export const formPresets = {
	"neuro-stacked": {
		"form.root.gap": "24px",
		"form-field.root.gap": "6px",
		"form-field.label.color": "#e2e8f0",
		"form-field.label.font-weight": "500",
		"form-field.description.color": "#64748b",
		"form-field.error.color": "#ef4444",
		"form-field.error.font-size": "0.75rem",
	},
	"flat-compact": {
		"form.root.gap": "16px",
		"form-field.root.gap": "4px",
		"form-field.label.color": "#94a3b8",
		"form-field.label.font-weight": "500",
		"form-field.description.color": "#475569",
		"form-field.error.color": "#ef4444",
		"form-field.error.font-size": "0.75rem",
	},
} as const;
