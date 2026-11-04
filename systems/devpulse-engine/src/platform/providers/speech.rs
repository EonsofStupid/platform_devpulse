//! Speech over saved connections — the engine facade over the kernel's bindings
//! (`devpulse_clyffy::providers::connections`). The kernel decides; credentials
//! stay in the kernel; nothing here touches an endpoint itself.
//!
//! The `*_at_endpoint` calls answer `None` only when nothing is bound. A binding
//! that cannot be honoured is an error, so an edited or removed server is never
//! quietly replaced by something else.

use anyhow::Result;
use devpulse_clyffy::providers::adapters::openai_compatible::EndpointAudio;
pub use devpulse_clyffy::providers::connections::{
    SpeechBinding, SpeechBindingState, SpeechEndpoints, SpeechHearing, SpeechRole,
};

use super::Providers;

impl Providers {
    /// Every speech binding and the adapters one may use.
    /// # Errors
    /// Returns storage errors or an unavailable user database.
    pub async fn speech_endpoints(&self) -> Result<SpeechEndpoints> {
        self.connection_service()?.speech_endpoints().await
    }

    /// One role's binding. Without a user database nothing can be bound.
    /// # Errors
    /// Returns storage errors.
    pub async fn speech_endpoint(&self, role: SpeechRole) -> Result<Option<SpeechBinding>> {
        match self.connections.get() {
            Some(connections) => connections.speech_binding(role).await,
            None => Ok(None),
        }
    }

    /// Choose the saved connection and model one role uses.
    /// # Errors
    /// Propagates the kernel's refusals and storage errors.
    pub async fn set_speech_endpoint(
        &self,
        role: SpeechRole,
        connection: &str,
        revision: i64,
        model: &str,
    ) -> Result<SpeechEndpoints> {
        self.connection_service()?
            .set_speech_binding(role, connection, revision, model)
            .await
    }

    /// Stop using a connection for one role.
    /// # Errors
    /// Returns storage errors or an unavailable user database.
    pub async fn clear_speech_endpoint(&self, role: SpeechRole) -> Result<SpeechEndpoints> {
        self.connection_service()?.clear_speech_binding(role).await
    }

    /// Speak through the bound connection; `None` when nothing is bound.
    /// # Errors
    /// Propagates refused bindings and transport or response failures.
    pub async fn speak_at_endpoint(
        &self,
        text: &str,
        voice: &str,
        speed: Option<f32>,
    ) -> Result<Option<Vec<u8>>> {
        let Some(connections) = self.connections.get() else {
            return Ok(None);
        };
        let Some(prepared) = connections.prepare_speech(SpeechRole::Tts).await? else {
            return Ok(None);
        };
        prepared.speak(text, voice, speed).await.map(Some)
    }

    /// Transcribe through the bound connection; `None` when nothing is bound.
    /// # Errors
    /// Propagates refused bindings and transport or response failures.
    pub async fn transcribe_at_endpoint(
        &self,
        samples: &[f32],
        sample_rate: u32,
        channels: u16,
        hearing: &SpeechHearing,
    ) -> Result<Option<String>> {
        let Some(connections) = self.connections.get() else {
            return Ok(None);
        };
        let Some(prepared) = connections.prepare_speech(SpeechRole::Stt).await? else {
            return Ok(None);
        };
        prepared
            .transcribe(
                EndpointAudio {
                    samples,
                    sample_rate,
                    channels,
                },
                hearing,
            )
            .await
            .map(Some)
    }
}
