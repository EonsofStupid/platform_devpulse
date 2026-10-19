/**
 * @file ColdLight Enforcement
 * @package @devpulse/coldlight
 *
 * failOnParity: true   — parity errors BLOCK manifest generation.
 *                         Every coldlight primitive MUST meet contract + parity rules.
 *                         Adapter folders MUST contain all 8 required files.
 *                         No orphan adapter folders allowed.
 * failOnContractLoad: true — bad contracts ARE fatal (corrupt SSOT).
 * warnOnParity: true   — log parity gaps with detail (before failing).
 */

export const ENFORCEMENT = {
	mode: "strict",
	failOnParity: true,
	failOnContractLoad: true,
	warnOnParity: true,
	lefthook: {
		enabled: true,
		verifyCmd: "pnpm coldlight:verify",
	},
} as const;
