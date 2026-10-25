/**
 * @file api/adapters/meltui/_internal/fileupload/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI file upload _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createFileUploadTransport from here — NEVER from melt directly.
 */

export { createFileUploadTransport } from "./_transport/index.js";
export type {
	FileUploadTransport,
	FileUploadTransportConfig,
	FileUploadTransportStates,
} from "./_transport/index.js";
export { createMeltFileUpload, type MeltFileUploadConfig, type MeltFileUploadInstance } from "./factory.js";
