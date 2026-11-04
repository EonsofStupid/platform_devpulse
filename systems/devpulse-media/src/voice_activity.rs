//! Energy-based voice activity detection for a short microphone capture.
//!
//! The saved VAD setting is a sensitivity from 0 to 1, where lower means it
//! triggers on quieter audio. Speech sits far below full scale, so the setting
//! is read on a decibel scale rather than as a raw amplitude: 0 gates at -60 `dBFS`
//! (just above a quiet room), 1 at -10 `dBFS` (a shout), and the default 0.5 at
//! -35 `dBFS`, under ordinary speech at a headset microphone.

/// The level the setting's 0 end gates at.
const QUIETEST_DBFS: f32 = -60.0;
/// The level the setting's 1 end gates at.
const LOUDEST_DBFS: f32 = -10.0;
/// Length of one measured frame.
const FRAME_MS: u32 = 20;
/// Kept either side of the speech, so soft word edges are not cut.
const PADDING_MS: u32 = 200;

/// The RMS amplitude a frame must reach at this sensitivity.
fn gate(threshold: f32) -> f32 {
    let threshold = if threshold.is_finite() {
        threshold.clamp(0.0, 1.0)
    } else {
        0.0
    };
    let dbfs = QUIETEST_DBFS + threshold * (LOUDEST_DBFS - QUIETEST_DBFS);
    10f32.powf(dbfs / 20.0)
}

#[expect(
    clippy::cast_precision_loss,
    reason = "frame lengths are a few thousand samples, exact in f32"
)]
fn rms(frame: &[f32]) -> f32 {
    (frame.iter().map(|s| s * s).sum::<f32>() / frame.len() as f32).sqrt()
}

/// The part of a mono capture holding speech, with a little padding; `None` when
/// no frame reaches the sensitivity, so silence is never sent to be transcribed.
#[must_use]
pub fn trim_to_voice(samples: &[f32], sample_rate: u32, threshold: f32) -> Option<&[f32]> {
    let frame_len = usize::try_from(u64::from(sample_rate) * u64::from(FRAME_MS) / 1_000)
        .ok()
        .filter(|n| *n > 0)?;
    let gate = gate(threshold);
    let voiced = |frame: &&[f32]| rms(frame) >= gate;
    let first = samples.chunks(frame_len).position(|f| voiced(&f))?;
    let last = samples.chunks(frame_len).rposition(|f| voiced(&f))?;
    let padding = usize::try_from(u64::from(sample_rate) * u64::from(PADDING_MS) / 1_000).ok()?;
    let start = (first * frame_len).saturating_sub(padding);
    let end = ((last + 1) * frame_len)
        .saturating_add(padding)
        .min(samples.len());
    samples.get(start..end)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    const RATE: u32 = 16_000;

    /// One second of silence, a half second at `amplitude`, one second of silence.
    fn capture(amplitude: f32) -> Vec<f32> {
        let mut samples = vec![0.0; 16_000];
        samples.extend((0..8_000).map(|i| if i % 2 == 0 { amplitude } else { -amplitude }));
        samples.extend(vec![0.0; 16_000]);
        samples
    }

    #[test]
    fn silence_is_not_speech_at_any_sensitivity() {
        let silence = vec![0.0; 16_000];
        assert!(trim_to_voice(&silence, RATE, 0.0).is_none());
        assert!(trim_to_voice(&silence, RATE, 0.5).is_none());
        assert!(trim_to_voice(&[], RATE, 0.5).is_none());
    }

    #[test]
    fn speech_is_kept_with_its_padding_and_the_silence_goes() {
        let samples = capture(0.1);
        let kept = trim_to_voice(&samples, RATE, 0.5).unwrap();
        // The speech plus 200 ms either side, to the 20 ms frame.
        assert_eq!(kept.len(), 8_000 + 3_200 + 3_200);
        assert!(kept.iter().any(|s| s.abs() > 0.05));
    }

    #[test]
    fn padding_stops_at_the_edges_of_the_capture() {
        let samples = vec![0.1; 1_600];
        assert_eq!(trim_to_voice(&samples, RATE, 0.5).unwrap().len(), 1_600);
    }

    #[test]
    fn lower_means_it_triggers_on_quieter_audio() {
        let quiet = capture(0.005);
        assert!(trim_to_voice(&quiet, RATE, 0.5).is_none());
        assert!(trim_to_voice(&quiet, RATE, 0.1).is_some());
        let loud = capture(0.5);
        assert!(trim_to_voice(&loud, RATE, 1.0).is_some());
    }

    #[test]
    fn a_broken_setting_stays_at_its_most_sensitive() {
        assert!(trim_to_voice(&capture(0.005), RATE, f32::NAN).is_some());
    }
}
