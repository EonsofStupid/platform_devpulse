//! Audio playback service — rodio-backed speaker output.
//!
//! Wraps rodio's `OutputStream` + `Sink` for playing PCM audio from TTS.
//! Thread-safe via flume channel — callers send audio, service thread plays it.
//!
//! Does NOT capture microphone — that's a separate cpal service (future).

use anyhow::Result;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// PCM audio data for playback.
#[derive(Debug, Clone)]
pub struct PlaybackRequest {
    /// Raw PCM samples (f32, mono).
    pub samples: Vec<f32>,
    /// Sample rate in Hz.
    pub sample_rate: u32,
    /// Number of channels (1 = mono).
    pub channels: u16,
}

/// Audio playback commands sent to the playback thread.
enum AudioCommand {
    /// Play audio through speakers.
    Play(PlaybackRequest),
    /// Stop current playback.
    Stop,
    /// Shutdown the audio thread.
    Shutdown,
}

/// Handle to the audio playback service. Clone + Send.
#[derive(Clone)]
pub struct AudioHandle {
    sender: flume::Sender<AudioCommand>,
    playing: Arc<AtomicBool>,
}

impl AudioHandle {
    /// Queue audio for playback. Non-blocking — returns immediately.
    pub fn play(&self, request: PlaybackRequest) -> Result<()> {
        self.sender
            .send(AudioCommand::Play(request))
            .map_err(|_| anyhow::anyhow!("Audio playback thread disconnected"))?;
        Ok(())
    }

    /// Stop current playback.
    pub fn stop(&self) -> Result<()> {
        self.sender
            .send(AudioCommand::Stop)
            .map_err(|_| anyhow::anyhow!("Audio playback thread disconnected"))?;
        Ok(())
    }

    /// Whether audio is currently playing.
    pub fn is_playing(&self) -> bool {
        self.playing.load(Ordering::Relaxed)
    }

    /// Shutdown the audio thread.
    pub fn shutdown(&self) {
        let _ = self.sender.send(AudioCommand::Shutdown);
    }
}

/// The audio playback service. Owns a dedicated thread for rodio.
pub struct AudioService {
    handle: AudioHandle,
    thread: Option<std::thread::JoinHandle<()>>,
}

impl AudioService {
    /// Spawn the audio playback service.
    ///
    /// Creates a dedicated OS thread that owns the rodio `OutputStream`.
    /// Returns immediately — all interaction is via `AudioHandle`.
    pub fn spawn() -> Result<Self> {
        let (tx, rx) = flume::unbounded::<AudioCommand>();
        let playing = Arc::new(AtomicBool::new(false));
        let playing_clone = playing.clone();

        let thread = std::thread::Builder::new()
            .name("audio-playback".into())
            .spawn(move || {
                audio_thread(rx, playing_clone);
            })
            .map_err(|e| anyhow::anyhow!("Failed to spawn audio thread: {e}"))?;

        tracing::info!(component = "AudioService", "Audio playback service started");

        Ok(Self {
            handle: AudioHandle {
                sender: tx,
                playing,
            },
            thread: Some(thread),
        })
    }

    /// Get a cloneable handle for callers.
    #[must_use]
    pub fn handle(&self) -> AudioHandle {
        self.handle.clone()
    }
}

impl Drop for AudioService {
    fn drop(&mut self) {
        self.handle.shutdown();
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}

/// Main loop on the audio playback thread.
fn audio_thread(rx: flume::Receiver<AudioCommand>, playing: Arc<AtomicBool>) {
    // Initialize rodio output — this must happen on this thread
    let output = match rodio::OutputStream::try_default() {
        Ok((stream, handle)) => Some((stream, handle)),
        Err(e) => {
            tracing::error!(
                component = "AudioService",
                error = %e,
                "Failed to open audio output device — playback disabled"
            );
            None
        }
    };

    let sink = output.as_ref().and_then(|(_, handle)| {
        rodio::Sink::try_new(handle)
            .map_err(|e| {
                tracing::error!(
                    component = "AudioService",
                    error = %e,
                    "Failed to create audio sink"
                );
            })
            .ok()
    });

    while let Ok(cmd) = rx.recv() {
        match cmd {
            AudioCommand::Play(request) => {
                if let Some(ref sink) = sink {
                    playing.store(true, Ordering::Relaxed);
                    let source = rodio::buffer::SamplesBuffer::new(
                        request.channels,
                        request.sample_rate,
                        request.samples,
                    );
                    sink.append(source);
                    tracing::debug!(
                        component = "AudioService",
                        sample_rate = request.sample_rate,
                        "Playing audio"
                    );
                    // Wait for playback to finish
                    sink.sleep_until_end();
                    playing.store(false, Ordering::Relaxed);
                } else {
                    tracing::warn!(
                        component = "AudioService",
                        "Playback requested but no audio device available"
                    );
                }
            }
            AudioCommand::Stop => {
                if let Some(ref sink) = sink {
                    sink.stop();
                    playing.store(false, Ordering::Relaxed);
                    tracing::debug!(component = "AudioService", "Playback stopped");
                }
            }
            AudioCommand::Shutdown => {
                tracing::info!(component = "AudioService", "Audio thread shutting down");
                if let Some(ref sink) = sink {
                    sink.stop();
                }
                break;
            }
        }
    }

    playing.store(false, Ordering::Relaxed);
    tracing::info!(component = "AudioService", "Audio thread exited");
}
