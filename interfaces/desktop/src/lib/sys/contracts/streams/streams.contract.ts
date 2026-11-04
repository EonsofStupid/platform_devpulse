/**
 * @file sys/contracts/streams/streams.contract.ts
 * @module @devpulse/sys/contracts/streams
 * @description Stream/subscription contracts for async data flows
 *
 * Describes the app's live subscriptions so they can be read and checked. The
 * subscriptions themselves are the signal fabric (`sys/events/signal-fabric.ts`)
 * and `createTauriEvent` (`sys/streams`), which report here: message envelopes
 * are their typed payloads, and a subscription handle is the teardown they return.
 */

import { type } from "arktype";
import type { Registry } from "../registry/registry.contract.js";

export const StreamStatusContract = type(
	"'idle' | 'connecting' | 'active' | 'paused' | 'error' | 'closed'",
);

/** Stream status */
export type StreamStatus = typeof StreamStatusContract.infer;

/** Stream metadata for registry */
export const StreamMetadataContract = type({
	/** Stream identifier */
	id: "string > 0",
	/** Stream type: 'signal' or 'tauri-event' */
	type: "string > 0",
	/** Source URL or identifier */
	source: "string > 0",
	/** Current status */
	status: StreamStatusContract,
	/** When stream was created */
	createdAt: "Date",
	/** Last message timestamp */
	"lastMessageAt?": "Date",
	/** Error message if status is 'error' */
	"error?": "string",
});

export type StreamMetadata = typeof StreamMetadataContract.infer;

/** Streams registry contract */
export interface StreamsRegistry extends Registry<StreamMetadata> {
	/** Get streams by type */
	getByType(type: string): StreamMetadata[];
	/** Get active streams */
	getActive(): StreamMetadata[];
}
