/**
 * @file sys/contracts/domains/app/voice-lab/voice-lab.contract.ts
 * @description Voice Lab domain contracts
 *
 * A hub that came after the owner's six, in their shape: every sidebar hub
 * has a contract, and the architecture test holds it to that.
 */

import { defineDomain } from "../../../routing/domain.contract.js";

/** Voice Lab feature identifiers */
export const VOICE_LAB_FEATURES = ["lab"] as const;

export type VoiceLabFeature = (typeof VOICE_LAB_FEATURES)[number];

/** Voice Lab domain metadata constant */
export const VOICE_LAB_DOMAIN = defineDomain({
	id: "voice-lab",
	owner: "app/voice",
	status: "active",
	defaultFeature: "lab",
	features: VOICE_LAB_FEATURES,
	order: 66,
});
