/**
 * @file ColdLight Enforcement
 * @package @devpulse/coldlight
 */

export const ENFORCEMENT = {
  mode: "strict",
  failOnParity: true,
  failOnContractLoad: true,
  lefthook: {
    enabled: true,
    verifyScript: "pnpm coldlight:verify",
  },
} as const;
