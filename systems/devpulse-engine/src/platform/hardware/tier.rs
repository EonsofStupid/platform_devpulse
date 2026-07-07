//! Hardware tier — the VRAM/GPU class the local machine falls into, used to
//! pick a default model preset. Non-AI local hardware detection (Tier-1,
//! DevPulse). The AI-side preset computation that maps a tier to concrete
//! model recommendations lives with the model loader on Clyffy.

use serde::{Deserialize, Serialize};

/// Hardware tier — maps to a default preset.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, specta::Type)]
pub enum HardwareTier {
    /// 40 GB+ VRAM — Preset 5 (Ultra). Static 30B-A3B `MoE` brain.
    Ultra,
    /// 24 GB+ VRAM — Preset 4 (High). Static, 14B+ brain.
    High,
    /// 16 GB VRAM — Preset 3 (Primary). `ActiveIdle`, 15B/4B swap.
    JessePrimary,
    /// 10 GB+ VRAM — Preset 2 (Mid). `ActiveIdle`, 9B/4B swap.
    Mid,
    /// 8 GB VRAM — Preset 1 (Floor). Static, 4B brain.
    Floor,
    /// < 8 GB or no GPU — Preset 7 (API-Enhanced) if API key, else Floor on CPU.
    Minimal,
    /// No GPU detected — CPU-only or API.
    CpuOnly,
}
