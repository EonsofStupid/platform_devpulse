//! Phoneme extraction for TTS models.
//!
//! Kokoro (and other IPA-based TTS models) expect phoneme **IDs**, not raw text
//! codepoints. This module provides two-stage phonemization:
//!
//! 1. **Grapheme → phoneme string** via [`text_to_phonemes`]. Backend is
//!    gated by the `espeak-phonemizer` Cargo feature; when disabled, returns
//!    a clear error rather than silently producing garbage.
//! 2. **Phoneme string → model IDs** via [`KokoroVocab::encode`]. The vocab
//!    is loaded from a JSON file shipped alongside the model
//!    (`vocab.json` — `{ "_": 0, "ɐ": 1, ... }`).
//!
//! The previous implementation cast Unicode codepoints directly to i64, which
//! produced out-of-range IDs and meaningless audio. That path has been removed.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// A Kokoro phoneme vocabulary — maps phoneme characters (and punctuation) to
/// the integer token IDs the ONNX model expects on its `input_ids` tensor.
///
/// Load via [`KokoroVocab::from_file`], pointing at the `vocab.json` that ships
/// with the Kokoro model package. The file is a flat `{ "ph": id, ... }` map.
#[derive(Debug, Clone)]
pub struct KokoroVocab {
    /// Path the vocabulary was loaded from (for diagnostics).
    source: PathBuf,
    /// Phoneme → token-id table.
    table: HashMap<String, i64>,
    /// Padding / blank token ID (almost always `0`).
    pad_id: i64,
}

impl KokoroVocab {
    /// Load a Kokoro phoneme vocabulary from a JSON file.
    ///
    /// Expected format: a flat object `{ "phoneme": id, ... }`. The pad token is
    /// resolved as `"_"` if present, otherwise `0`.
    ///
    /// # Errors
    /// Returns an error if the file cannot be read or does not parse as a
    /// `{ string: integer }` map.
    pub fn from_file(path: &Path) -> anyhow::Result<Self> {
        let bytes = std::fs::read(path)
            .map_err(|e| anyhow::anyhow!("Failed to read Kokoro vocab {}: {e}", path.display()))?;
        let raw: HashMap<String, i64> = serde_json::from_slice(&bytes)
            .map_err(|e| anyhow::anyhow!("Failed to parse Kokoro vocab as JSON map: {e}"))?;

        let pad_id = raw.get("_").copied().unwrap_or(0);

        Ok(Self {
            source: path.to_path_buf(),
            table: raw,
            pad_id,
        })
    }

    /// Number of entries in the vocabulary.
    #[must_use]
    pub fn len(&self) -> usize {
        self.table.len()
    }

    /// Whether the vocabulary is empty (no entries loaded).
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.table.is_empty()
    }

    /// The padding token ID, used around the phoneme sequence during inference.
    #[must_use]
    pub fn pad_id(&self) -> i64 {
        self.pad_id
    }

    /// Path the vocabulary was loaded from — useful for error messages.
    #[must_use]
    pub fn source(&self) -> &Path {
        &self.source
    }

    /// Convert a phoneme *string* (as produced by espeak-ng) into model token IDs.
    ///
    /// Phonemes are matched greedily by grapheme cluster. Unknown phonemes are
    /// **skipped with a trace warning** rather than failing — eSpeak can emit
    /// stress and intonation markers (`ˈ`, `ˌ`, `ː`) that a given vocab may not
    /// include, and dropping them is the correct behaviour for Kokoro.
    ///
    /// The returned sequence is bracketed with [`Self::pad_id`] on both ends,
    /// matching the Kokoro reference implementation.
    pub fn encode(&self, phonemes: &str) -> Vec<i64> {
        let mut ids = Vec::with_capacity(phonemes.len() + 2);
        ids.push(self.pad_id);

        for ch in phonemes.chars() {
            // Try the single-char form first; Kokoro vocabs are grapheme-level.
            let key = ch.to_string();
            if let Some(&id) = self.table.get(&key) {
                ids.push(id);
            } else {
                tracing::trace!(
                    component = "Kokoro phonemizer",
                    phoneme = %key,
                    "Skipping phoneme not in vocabulary"
                );
            }
        }

        ids.push(self.pad_id);
        ids
    }
}

// ── Grapheme → phoneme (eSpeak NG FFI, feature-gated) ─────────────────

/// Convert a UTF-8 text fragment into an IPA phoneme string, using eSpeak NG.
///
/// `voice` is an eSpeak voice identifier (e.g. `"en-us"`, `"en-gb"`, `"de"`).
///
/// # Errors
/// Returns an error if:
/// - The `espeak-phonemizer` feature is not enabled (the function is a stub).
/// - eSpeak NG initialization fails (missing data dir or DLL).
/// - The requested voice cannot be selected.
#[cfg(feature = "espeak-phonemizer")]
pub fn text_to_phonemes(text: &str, voice: &str) -> anyhow::Result<String> {
    use espeakng_sys as es;
    use std::ffi::CString;
    use std::os::raw::{c_char, c_int, c_void};
    use std::sync::Mutex;

    // eSpeak is not thread-safe — serialize all calls through a process-wide lock
    // and only initialize the library once.
    static ESPEAK_LOCK: Mutex<bool> = Mutex::new(false);

    let mut init_guard = ESPEAK_LOCK
        .lock()
        .map_err(|e| anyhow::anyhow!("eSpeak init mutex poisoned: {e}"))?;

    if !*init_guard {
        // AUDIO_OUTPUT_SYNCHRONOUS = 1, but we only need phoneme output so any
        // valid mode works. Buffer length 500ms is the upstream default.
        // SAFETY: FFI call into the eSpeak C library. All pointer arguments are
        // either null (for default data path) or uninitialized; this matches
        // the upstream README example and the library's documented contract.
        #[allow(unsafe_code)]
        let rate = unsafe {
            es::espeak_Initialize(
                es::espeak_AUDIO_OUTPUT_AUDIO_OUTPUT_SYNCHRONOUS,
                500,
                std::ptr::null(),
                0,
            )
        };
        if rate < 0 {
            anyhow::bail!("espeak_Initialize failed: code {rate}");
        }
        *init_guard = true;
    }

    let voice_c =
        CString::new(voice).map_err(|e| anyhow::anyhow!("Voice name has interior nul: {e}"))?;
    // SAFETY: see note on espeak_Initialize above. `voice_c` lives for the
    // duration of the call.
    #[allow(unsafe_code)]
    let voice_rc = unsafe { es::espeak_SetVoiceByName(voice_c.as_ptr() as *const c_char) };
    if voice_rc != es::espeak_ERROR_EE_OK {
        anyhow::bail!("espeak_SetVoiceByName({voice}) failed: code {voice_rc}");
    }

    let text_c =
        CString::new(text).map_err(|e| anyhow::anyhow!("Input text has interior nul: {e}"))?;
    let mut text_ptr = text_c.as_ptr() as *const c_void;

    // phoneme_mode = 0x02 → IPA output as UTF-8. No separator, no tie.
    let phoneme_mode: c_int = 0x02;
    // textmode = espeakCHARS_UTF8 (1)
    let text_mode: c_int = 1;

    let mut collected = String::new();
    // eSpeak returns phonemes for one sentence at a time; loop until textptr
    // is advanced to NULL signalling end-of-input.
    loop {
        // SAFETY: FFI call; `text_ptr` is a valid pointer to a null-terminated
        // UTF-8 buffer on the first iteration and is updated in-place by the
        // call afterwards.
        #[allow(unsafe_code)]
        let result_ptr =
            unsafe { es::espeak_TextToPhonemes(&mut text_ptr, text_mode, phoneme_mode) };
        if result_ptr.is_null() {
            break;
        }
        // SAFETY: eSpeak guarantees a static, null-terminated buffer owned by
        // the library on success. We copy immediately before the next call.
        #[allow(unsafe_code)]
        let chunk = unsafe { std::ffi::CStr::from_ptr(result_ptr) };
        collected.push_str(&chunk.to_string_lossy());

        if text_ptr.is_null() {
            break;
        }
    }

    Ok(collected)
}

/// Stub fallback when the `espeak-phonemizer` feature is not enabled.
///
/// Returns a clear error rather than silently producing nonsense. Build with
/// `--features espeak-phonemizer` and install eSpeak NG + LLVM (for bindgen)
/// to enable real phonemization.
///
/// # Errors
/// Always returns an error explaining that the `espeak-phonemizer` feature
/// must be enabled at compile time. There is no success path in this build.
#[cfg(not(feature = "espeak-phonemizer"))]
pub fn text_to_phonemes(_text: &str, _voice: &str) -> anyhow::Result<String> {
    anyhow::bail!(
        "Phonemization requires the `espeak-phonemizer` feature. Rebuild \
         model-loader with `--features espeak-phonemizer` and install \
         eSpeak NG on the host (see README for Windows/Linux setup)."
    )
}

/// High-level helper: text → Kokoro model token IDs.
///
/// Combines [`text_to_phonemes`] and [`KokoroVocab::encode`] into one call.
///
/// # Errors
/// Propagates any error from phonemization or vocab encoding.
pub fn text_to_kokoro_ids(
    text: &str,
    voice: &str,
    vocab: &KokoroVocab,
) -> anyhow::Result<Vec<i64>> {
    let phonemes = text_to_phonemes(text, voice)?;
    tracing::debug!(
        component = "Kokoro phonemizer",
        text_len = text.len(),
        phoneme_len = phonemes.len(),
        "Phonemes extracted"
    );
    Ok(vocab.encode(&phonemes))
}
