/**
 * @file sts-latency.state.svelte.ts — STS per-stage latency rune.
 * @module @devpulse/devtools/clyffy/ears/sts
 *
 * STS straddles the STT and TTS slots; latency is per-stage so the
 * devtool can localise breakage. The rune holds rolling milliseconds
 * for each stage; the smoke-test command already returns its own
 * `duration_ms`, kept separate from per-action latency.
 */

class StsLatencyState {
	/** Last full-pipeline duration in ms (decode → STT → brain → TTS → playback). */
	pipelineMs = $state<number | null>(null);
	/** Last record+transcribe round-trip in ms. */
	sttMs = $state<number | null>(null);
	/** Last `speak()` round-trip in ms. */
	ttsMs = $state<number | null>(null);

	recordPipeline(ms: number): void {
		this.pipelineMs = Math.round(ms);
	}
	recordStt(ms: number): void {
		this.sttMs = Math.round(ms);
	}
	recordTts(ms: number): void {
		this.ttsMs = Math.round(ms);
	}
}

export const stsLatencyState = new StsLatencyState();
