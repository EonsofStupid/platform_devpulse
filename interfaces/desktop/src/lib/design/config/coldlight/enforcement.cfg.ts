/**
 * @file ColdLight Enforcement
 * @package @devpulse/coldlight
 *
 * failOnParity: false  — parity errors are warnings, scanner still emits manifest.
 *                         Kinds with missing .svelte get status: "contract-only".
 * failOnContractLoad: true — bad contracts ARE fatal (corrupt SSOT).
 * warnOnParity: true   — log parity gaps so they're visible but non-blocking.
 */

export const ENFORCEMENT = {
	mode: "strict",
	failOnParity: false,
	failOnContractLoad: true,
	warnOnParity: true,
	lefthook: {
		enabled: true,
		verifyCmd: "pnpm coldlight:verify",
	},
} as const;
