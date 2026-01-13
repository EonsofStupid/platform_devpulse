# SigLIP 2 NaFlex + Candle Integration Reference

| Field | Value |
|-------|-------|
| **Status** | `RESEARCH COMPLETE` |
| **Version** | `1.0.0` |
| **Date** | `2026-01-08` |
| **Target** | Rust VLM inference with component-level device placement |

---

## Executive Summary

This document provides implementation-ready technical specifications for integrating SigLIP 2 NaFlex vision encoders into a Rust ML platform using Candle. Focus areas: component-level device placement, quantization for 300-400MB target, and production inference patterns.

---

## SigLIP 2 Architecture Specifications

### Model Variants

| Variant | Params | Hidden | Layers | Heads | Patch | Use Case |
|---------|--------|--------|--------|-------|-------|----------|
| ViT-B/16 | 86M | 768 | 12 | 12 | 16 | **Distillation target** |
| ViT-B/32 | ~86M | 768 | 12 | 12 | 32 | Faster inference |
| ViT-L/16 | 303M | 1024 | 24 | 16 | 16 | Balanced |
| So400m/14 | 400M | 1152 | 27 | 16 | 14 | Production quality |
| ViT-g/16 | 1B | 1536 | 40 | 16 | 16 | Maximum quality |

### NaFlex Specifics

NaFlex = Native Aspect Ratio + Flexible Sequence Length

**Key Properties:**
- Processes images at native aspect ratio (minimal distortion)
- Single checkpoint supports multiple sequence lengths: `128, 256, 576, 784, 1024`
- Height/width resized to multiples of patch size
- Padding mask added for variable sequence handling
- **Interpolates well between training resolutions, does NOT extrapolate**

**NaFlex Preprocessing Algorithm:**
```
1. Given: patch_size, target_seq_length (max_num_patches)
2. Resize image so H and W are multiples of patch_size
3. Keep aspect ratio distortion minimal: max distortion = (patch_size-1)/dimension
4. Ensure sequence_length <= target_seq_length
5. Split into patches, add position coordinates + padding mask
```

**Performance Characteristics:**
- NaFlex excels at OCR/document tasks
- FixRes (fixed resolution) better for natural images due to distillation step
- Use NaFlex when aspect ratio matters (documents, screenshots, UI)

### Tokenizer

SigLIP 2 uses **Gemma tokenizer** (256k vocabulary), NOT the original 32k English-only tokenizer.

```
Text input: max 64 tokens
Tokenizer: SentencePiece-based multilingual (109 languages)
Special tokens: </s> (EOS/PAD), <unk>
```

---

## Candle Implementation Patterns

### Device Placement Architecture

Candle `Device` enum:
```rust
pub enum Device {
    Cpu,
    Cuda(CudaDevice),
    Metal(MetalDevice),
}
```

**Construction:**
```rust
// Explicit
let cpu = Device::Cpu;
let gpu = Device::new_cuda(0)?;
let metal = Device::new_metal(0)?;

// Conditional fallback
let device = Device::cuda_if_available(0)?; // Falls back to CPU
```

### Component-Level Loading Pattern

**The key insight: Create separate VarBuilders with different devices/dtypes**

```rust
use candle_core::{Device, DType};
use candle_nn::VarBuilder;

// Vision encoder on CPU (FP32 for quality, or quantized)
let vision_device = Device::Cpu;
let vision_vb = unsafe {
    VarBuilder::from_mmaped_safetensors(
        &["vision_encoder.safetensors"],
        DType::F32,  // Or load quantized
        &vision_device,
    )?
};

// LLM on GPU (FP16 for speed)
let llm_device = Device::new_cuda(0)?;
let llm_vb = unsafe {
    VarBuilder::from_mmaped_safetensors(
        &["language_model.safetensors"],
        DType::F16,
        &llm_device,
    )?
};

// Projector matches LLM device
let proj_vb = unsafe {
    VarBuilder::from_mmaped_safetensors(
        &["projector.safetensors"],
        DType::F16,
        &llm_device,
    )?
};
```

### VarBuilder Prefix System

Navigate model weights hierarchically:
```rust
// Root builder
let vb = VarBuilder::from_mmaped_safetensors(&[path], dtype, &device)?;

// Navigate to submodule
let encoder_vb = vb.pp("vision_model").pp("encoder");
let layer_vb = encoder_vb.pp("layers").pp("0");

// Load specific tensor
let weight = layer_vb.get(&[hidden_size, hidden_size], "self_attn.q_proj.weight")?;
```

### Cross-Device Tensor Transfer

When vision features need to move to LLM device:
```rust
// Vision output on CPU
let image_features = vision_encoder.forward(&pixel_values)?; // On CPU

// Transfer to GPU for LLM
let image_features_gpu = image_features.to_device(&llm_device)?;

// Project and feed to LLM
let projected = projector.forward(&image_features_gpu)?;
```

---

## Quantization for Size Optimization

### Supported Quantization Types (GGML/GGUF)

| Type | Bits | Block Size | Quality | Size Reduction |
|------|------|------------|---------|----------------|
| Q8_0 | 8 | 32 | Highest | ~2x |
| Q6K | 6 | - | Very High | ~2.5x |
| Q5_1 | 5 | 32 | High | ~3x |
| Q5_0 | 5 | 32 | High | ~3x |
| Q4_1 | 4 | 32 | Good | ~4x |
| Q4_0 | 4 | 32 | Good | ~4x |
| Q3K | 3 | - | Moderate | ~5x |
| Q2K | 2 | - | Low | ~8x |

### Loading Quantized Models

```rust
use candle_transformers::quantized_var_builder::VarBuilder as QVarBuilder;

// From GGUF file
let vb = QVarBuilder::from_gguf("model.gguf", &device)?;

// Access quantized tensors
let qtensor = vb.get(&[out_features, in_features], "layer.weight")?;

// Tensors stay quantized - no automatic dequantization at load
```

### QTensor Operations

```rust
use candle_core::quantized::{QTensor, GgmlDType};

// Quantize from F32
let qtensor = QTensor::quantize(&f32_tensor, GgmlDType::Q4_0)?;

// Dequantize when needed
let f32_storage = qtensor.dequantize(&device)?;

// Dequantize to F16 (optimized CUDA path)
let f16_storage = qtensor.dequantize_f16(&device)?;
```

### Target: 300-400MB Vision Encoder

For ViT-B/16 (86M params):
- FP32: ~344 MB
- FP16: ~172 MB
- Q8_0: ~86 MB
- Q4_0: ~43 MB

**Recommendation for 300-400MB total VLM:**
- Vision encoder: ViT-B/16 at Q8_0 (~86 MB) - preserve quality
- Projector: FP16 (~5-10 MB)
- LLM: Use smallest viable, Q4_0 quantized

---

## SigLIP in Candle (Existing Implementation)

Candle already has SigLIP: `candle-transformers/src/models/siglip.rs`

### Configuration Defaults

```rust
// TextConfig
vocab_size: 32000,      // Original, SigLIP2 uses 256000
hidden_size: 768,
intermediate_size: 3072,
num_hidden_layers: 12,
num_attention_heads: 12,
max_position_embeddings: 64,
hidden_act: "gelu_pytorch_tanh",

// VisionConfig
hidden_size: 768,
intermediate_size: 3072,
num_hidden_layers: 12,
num_attention_heads: 12,
patch_size: 16,
image_size: 224,
num_channels: 3,
```

### Key Difference from CLIP

SigLIP uses `MultiheadAttentionPoolingHead` instead of learnable CLS token:
- Probe vector attends over all patches
- Single aggregated representation
- MLP refinement after pooling

### Forward Flow

```rust
impl Model {
    pub fn forward(&self, pixel_values: &Tensor, input_ids: &Tensor) -> Result<Tensor> {
        let image_features = self.get_image_features(pixel_values)?;
        let text_features = self.get_text_features(input_ids)?;

        // L2 normalize
        let image_features = div_l2_norm(&image_features)?;
        let text_features = div_l2_norm(&text_features)?;

        // Similarity with temperature
        let logits = text_features.matmul(&image_features.t()?)?;
        let logits = (logits * self.logit_scale.exp()?)? + self.logit_bias;

        Ok(logits)
    }
}
```

---

## VLM Integration Pattern (LLaVA Reference)

### Component Structure

```rust
struct VisionLanguageModel {
    vision_tower: ClipVisionTower,  // Or SigLIP
    mm_projector: MMProjector,
    llm: Llama,
    config: VLMConfig,
}
```

### Inference Flow

```
1. Image → VisionTower → hidden_states (select layer -1 or -2)
2. hidden_states → MMProjector → projected_features (match LLM dim)
3. Text tokens → Embeddings
4. Replace <image> tokens with projected_features
5. Combined embeddings → LLM → Generated text
```

### Projection Patterns

```rust
enum MMProjector {
    Linear(Linear),              // Simple projection
    MLP { layers: Vec<Linear>, act: Activation },  // Multi-layer
    Identity,                    // No transformation
}
```

---

## Memory Management

### Rust Drop Semantics

Candle tensors use Rust ownership - when model goes out of scope, memory reclaims:

```rust
{
    let model = load_model(&device)?;
    let output = model.forward(&input)?;
    // model dropped here, GPU memory freed
}
```

### Explicit VRAM Management (candle-cuda-vmm)

For multi-model serving:

```rust
use candle_cuda_vmm::SharedMemoryPool;

// Create pool with physical limit
let pool = SharedMemoryPool::new(8 * 1024 * 1024 * 1024)?; // 8GB limit

// Register models
pool.register_model("vision")?;
pool.register_model("llm")?;

// Allocate per-model
let vision_mem = pool.allocate("vision", 500 * 1024 * 1024)?; // 500MB

// Explicit deallocation
pool.deallocate("vision", 500 * 1024 * 1024)?;
```

### Memory-Mapped Loading

VarBuilder uses mmap for lazy loading:

```rust
// Tensors loaded on-demand, not all at once
let vb = unsafe {
    VarBuilder::from_mmaped_safetensors(&paths, dtype, &device)?
};
```

---

## Distillation Strategy for Smaller Models

### SigLIP 2 Distillation Recipe

Google's approach for ViT-B models:

1. Start from pretrained SigLIP 2 checkpoint
2. Lower learning rate to 1e-5
3. Remove weight decay
4. Train for additional 4B examples
5. Use only sigmoid image-text loss
6. Teacher: larger model (So400m or ViT-g)

### Active Data Curation (ACID)

Alternative to traditional KD:
- Online batch selection during training
- Outperforms standard KD across configurations
- Particularly effective for contrastive pretraining

### Self-Distillation

SigLIP 2 uses momentum encoder:
- Local-to-global correspondence learning
- Improves unpooled feature semantics
- Enables dense prediction tasks (segmentation, depth)

### Training Your Own 300-400MB Model

**Approach 1: Quantize existing**
- Take ViT-B/16 (86M params)
- Quantize to Q4_0 → ~43MB encoder
- Fine-tune on your domain

**Approach 2: Train smaller from scratch**
- Reduce layers: 12 → 6
- Reduce hidden: 768 → 512
- Use distillation from larger teacher
- Target: ~40M params → ~160MB FP32, ~40MB Q4_0

**Approach 3: Prune + distill**
- Start with pretrained ViT-B
- Apply structured pruning (attention heads, FFN)
- Distill to recover quality

---

## Tokenizer Verification

### Loading Tokenizer

```rust
use tokenizers::Tokenizer;

// Load from file
let tokenizer = Tokenizer::from_file("tokenizer.json")?;

// Or from HuggingFace Hub
let tokenizer = Tokenizer::from_pretrained("google/siglip2-base-patch16-naflex", None)?;
```

### Verification Checks

```rust
fn verify_tokenizer(tokenizer: &Tokenizer, expected_vocab_size: usize) -> Result<()> {
    // Check vocabulary size
    let vocab_size = tokenizer.get_vocab_size(true);
    assert_eq!(vocab_size, expected_vocab_size, "Vocab size mismatch");

    // Verify special tokens
    let eos_token = tokenizer.token_to_id("</s>");
    assert!(eos_token.is_some(), "Missing EOS token");

    // Test encode/decode roundtrip
    let test_text = "Hello, world!";
    let encoded = tokenizer.encode(test_text, true)?;
    let decoded = tokenizer.decode(encoded.get_ids(), true)?;
    assert!(decoded.contains("Hello"), "Roundtrip failed");

    Ok(())
}
```

---

## GGUF Safety Checks

### Model Verification

```rust
use candle_core::quantized::gguf_file;

fn verify_gguf(path: &str) -> Result<GGUFInfo> {
    let file = std::fs::File::open(path)?;
    let content = gguf_file::Content::read(&mut BufReader::new(file))?;

    // Check magic number (already done by Content::read)

    // Verify architecture
    let arch = content.metadata.get("general.architecture")
        .ok_or("Missing architecture metadata")?;

    // Check tensor count
    let tensor_count = content.tensor_infos.len();

    // Verify expected layers exist
    let has_vision = content.tensor_infos.keys()
        .any(|k| k.contains("vision"));

    Ok(GGUFInfo {
        architecture: arch.to_string(),
        tensor_count,
        has_vision_encoder: has_vision,
    })
}
```

### Quantization Type Validation

```rust
fn validate_quantization(qtensor: &QTensor, expected: GgmlDType) -> Result<()> {
    let actual = qtensor.dtype();
    if actual != expected {
        return Err(anyhow!(
            "Quantization mismatch: expected {:?}, got {:?}",
            expected, actual
        ));
    }

    // Verify shape divisibility
    let shape = qtensor.shape();
    let block_size = expected.block_size();
    if shape.dims().last().unwrap_or(&0) % block_size != 0 {
        return Err(anyhow!("Shape incompatible with block size"));
    }

    Ok(())
}
```

---

## Production Checklist

### Model Loading
- [ ] Verify safetensors/GGUF file integrity
- [ ] Check tokenizer vocabulary matches model
- [ ] Validate config parameters match weights
- [ ] Confirm device placement per component

### Inference
- [ ] Image preprocessing matches training (normalization, resize)
- [ ] Sequence length within NaFlex training range
- [ ] Padding mask correctly applied
- [ ] Cross-device transfers explicit

### Memory
- [ ] Monitor VRAM usage per component
- [ ] Implement graceful OOM handling
- [ ] Use mmap for large models
- [ ] Clean up tensors after batch

### Quality
- [ ] Benchmark against reference implementation
- [ ] Verify quantization doesn't degrade critical features
- [ ] Test edge cases (unusual aspect ratios, long text)

---

## Video/Capture Stack (Pure Rust, No FFmpeg)

### When You Need FFmpeg vs Pure Rust

**FFmpeg required:**
- Multiple codec transcoding (VP9→H.264→AV1)
- Complex audio/video sync with multiple tracks
- Streaming protocols (RTMP, HLS, DASH)
- Hardware decode AND encode in same pipeline
- Exotic formats (ProRes, DNxHD, broadcast)

**Pure Rust sufficient:**
- Screen recording to MP4
- Screenshots
- Frame extraction for VLM
- WebRTC video calls
- P2P sharing

### Recommended Crate Stack

```toml
[dependencies]
# Screen capture (cross-platform: Windows, macOS, Linux)
scap = "0.0"           # High-perf capture (CapSoftware)
xcap = "0.0"           # Alternative, video WIP

# Video encoding (H.264, Loom-quality)
openh264 = "0.6"       # Cisco's encoder, BSD license, auto-downloads

# MP4 muxing (pure Rust, zero deps)
muxide = "0.1"         # H.264, H.265, AV1, AAC, Opus

# WebRTC for P2P/video calls
webrtc = "0.11"        # Full WebRTC stack (STUN/TURN/ICE, DTLS/SRTP)

# Audio
cpal = "0.15"          # Cross-platform audio I/O
opus = "0.3"           # Voice codec (standard for WebRTC)
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CAPTURE LAYER                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │    scap     │    │    cpal     │    │    xcap     │              │
│  │  (screen)   │    │   (audio)   │    │  (windows)  │              │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ENCODE LAYER                                     │
│  ┌─────────────┐    ┌─────────────┐                                 │
│  │  openh264   │    │    opus     │                                 │
│  │  (H.264)    │    │   (voice)   │                                 │
│  └──────┬──────┘    └──────┬──────┘                                 │
└─────────┼──────────────────┼────────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     OUTPUT LAYER                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   muxide    │    │   webrtc    │    │  SigLIP +   │              │
│  │   (MP4)     │    │   (P2P)     │    │   VL-4B     │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│   Local Recording     Video Calls       VLM Pipeline                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Resolution Strategy

| Use Case | Resolution | Codec | Target |
|----------|------------|-------|--------|
| Ambient screenshots | 384px | - | SigLIP embedding |
| User sharing | 768px | PNG | P2P / Maestro |
| Video recording | 768px | H.264 | Local MP4 |
| Video calls | 720p | H.264 | WebRTC |
| VL-4B analysis | 768px | - | Full description |

### Screen Capture Implementation

```rust
use scap::{Capturer, Options, Frame};

pub struct ScreenCapture {
    capturer: Capturer,
}

impl ScreenCapture {
    pub fn new() -> Result<Self> {
        let options = Options {
            fps: 30,
            show_cursor: true,
            show_highlight: false,
            ..Default::default()
        };
        let capturer = Capturer::new(options)?;
        Ok(Self { capturer })
    }

    /// Capture single frame (for screenshots)
    pub fn capture_frame(&mut self) -> Result<Frame> {
        self.capturer.capture_frame()
    }

    /// Start continuous capture (for recording)
    pub fn start_capture(&mut self) -> Result<()> {
        self.capturer.start_capture()
    }
}
```

### Video Encoding Pipeline

```rust
use openh264::encoder::{Encoder, EncoderConfig};
use muxide::{Mp4Muxer, VideoTrack};

pub struct VideoRecorder {
    encoder: Encoder,
    muxer: Mp4Muxer,
    frame_count: u64,
}

impl VideoRecorder {
    pub fn new(width: u32, height: u32, output_path: &Path) -> Result<Self> {
        let config = EncoderConfig::new(width, height)
            .bitrate(2_000_000)  // 2 Mbps for Loom-quality
            .framerate(30.0);

        let encoder = Encoder::with_config(config)?;

        let muxer = Mp4Muxer::new(output_path)?;
        muxer.add_video_track(VideoTrack::h264(width, height, 30))?;

        Ok(Self { encoder, muxer, frame_count: 0 })
    }

    pub fn encode_frame(&mut self, frame: &[u8]) -> Result<()> {
        let encoded = self.encoder.encode(frame)?;
        self.muxer.write_video_sample(encoded, self.frame_count)?;
        self.frame_count += 1;
        Ok(())
    }

    pub fn finish(self) -> Result<PathBuf> {
        self.muxer.finish()
    }
}
```

### WebRTC P2P Setup

```rust
use webrtc::api::APIBuilder;
use webrtc::peer_connection::configuration::RTCConfiguration;
use webrtc::ice_transport::ice_server::RTCIceServer;

pub async fn create_peer_connection() -> Result<RTCPeerConnection> {
    let api = APIBuilder::new().build();

    let config = RTCConfiguration {
        ice_servers: vec![
            RTCIceServer {
                urls: vec!["stun:stun.l.google.com:19302".to_string()],
                ..Default::default()
            },
        ],
        ..Default::default()
    };

    let pc = api.new_peer_connection(config).await?;
    Ok(pc)
}

pub async fn add_video_track(pc: &RTCPeerConnection) -> Result<Arc<TrackLocalStaticSample>> {
    let video_track = Arc::new(TrackLocalStaticSample::new(
        RTCRtpCodecCapability {
            mime_type: "video/h264".to_string(),
            ..Default::default()
        },
        "video".to_string(),
        "screen".to_string(),
    ));

    pc.add_track(video_track.clone()).await?;
    Ok(video_track)
}
```

### Frame Extraction for VLM

```rust
impl VideoRecorder {
    /// Extract frames for VLM processing
    /// Strategy: keyframes + sample at 0.5 fps, max 30 frames
    pub fn extract_frames_for_vlm(&self, video_path: &Path) -> Result<Vec<Vec<u8>>> {
        let mut frames = Vec::new();
        let sample_interval = 2.0; // seconds
        let max_frames = 30;

        // Decode and sample frames
        // ... decoder implementation

        // Return PNG bytes for each sampled frame
        Ok(frames)
    }
}
```

### Integration with Vision Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEVPULSE VISION FLOW                             │
│                                                                      │
│  Screen Capture (scap @ 768px)                                       │
│         │                                                            │
│         ├──► openh264 ──► muxide ──► MP4 (local recording)          │
│         │                                                            │
│         ├──► openh264 ──► webrtc ──► P2P (video calls/sharing)      │
│         │                                                            │
│         └──► resize 384px ──► SigLIP ──► RRO (ambient embed)     │
│                                  │                                   │
│                                  └──► NoveltyGate                    │
│                                          │                           │
│                                    Novel? ──► VL-4B (description)    │
│                                          │                           │
│                                          └──► Signal to Orchestrator │
└─────────────────────────────────────────────────────────────────────┘
```

### Video Processing for VLM

```rust
pub struct VideoProcessor {
    vision_encoder: VisionEncoder,  // SigLIP
    vl_model: Option<VLModel>,      // Qwen3-VL-4B (when loaded)
}

impl VideoProcessor {
    /// Process video for VLM analysis
    /// 1. Extract keyframes
    /// 2. Sample remaining @ 0.5 fps (max 30 frames)
    /// 3. Embed each frame with SigLIP
    /// 4. Cluster by similarity (threshold 0.85)
    /// 5. VL-4B describes each cluster (not each frame)
    pub async fn process_video(&self, frames: Vec<Vec<u8>>) -> Result<VideoAnalysis> {
        // Embed all frames
        let embeddings: Vec<Vec<f32>> = frames
            .iter()
            .map(|f| self.vision_encoder.embed_image(f))
            .collect::<Result<Vec<_>>>()?;

        // Cluster similar frames
        let clusters = self.cluster_frames(&embeddings, 0.85)?;

        // VL-4B analyzes one representative per cluster
        let descriptions = if let Some(vl) = &self.vl_model {
            let mut descs = Vec::new();
            for cluster in &clusters {
                let rep_frame = &frames[cluster.representative_idx];
                let desc = vl.describe(rep_frame).await?;
                descs.push(desc);
            }
            descs
        } else {
            vec![]
        };

        Ok(VideoAnalysis {
            frame_count: frames.len(),
            cluster_count: clusters.len(),
            descriptions,
            embeddings,
        })
    }
}
```

### Cargo.toml Addition

```toml
# Video/Capture Stack (Pure Rust, No FFmpeg)
scap = "0.0"           # Screen capture
openh264 = "0.6"       # H.264 encoding
muxide = "0.1"         # MP4 muxing
webrtc = "0.11"        # P2P video calls
cpal = "0.15"          # Audio I/O
opus = "0.3"           # Voice codec
```

---

## Sources

- [SigLIP 2 Paper](https://arxiv.org/html/2502.14786v1)
- [HuggingFace SigLIP2 Docs](https://huggingface.co/docs/transformers/en/model_doc/siglip2)
- [HuggingFace Blog: SigLIP 2](https://huggingface.co/blog/siglip2)
- [google/siglip2-base-patch16-naflex](https://huggingface.co/google/siglip2-base-patch16-naflex)
- [Candle GitHub](https://github.com/huggingface/candle)
- [Candle ViT Implementation](https://github.com/huggingface/candle/blob/main/candle-transformers/src/models/vit.rs)
- [Candle SigLIP Implementation](https://github.com/huggingface/candle/blob/main/candle-transformers/src/models/siglip.rs)
- [candle-core quantized module](https://docs.rs/candle-core/latest/candle_core/quantized/index.html)
- [mistral.rs Device Mapping](https://github.com/EricLBuehler/mistral.rs/blob/master/docs/DEVICE_MAPPING.md)
- [scap - Screen Capture](https://github.com/CapSoftware/scap)
- [xcap - Cross-platform Capture](https://lib.rs/crates/xcap)
- [openh264 - H.264 Encoder](https://github.com/ralfbiedert/openh264-rs)
- [muxide - Pure Rust MP4 Muxer](https://github.com/Michael-A-Kuykendall/muxide)
- [webrtc-rs - Rust WebRTC](https://github.com/webrtc-rs/webrtc)
- [opus - Voice Codec](https://lib.rs/crates/opus)
- [cpal - Audio I/O](https://lib.rs/crates/cpal)
