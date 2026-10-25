//! Lab Voice Module - Independent Voice Stack
//! 
//! This module provides a separate instance of voice services (TTS/STT)
//! for training, diagnostics, and "Lab" experimentation, independent
//! of the main application's specific versions or configuration.

pub mod lab;

pub use lab::LabVoice;
