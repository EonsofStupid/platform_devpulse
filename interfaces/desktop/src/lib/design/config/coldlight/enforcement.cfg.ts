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
    verifyCmd: "pnpm coldlight:verify",
  },
} as const;
