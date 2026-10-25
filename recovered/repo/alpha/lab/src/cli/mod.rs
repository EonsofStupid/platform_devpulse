// lab/src/cli/mod.rs

//! Lab CLI Module - Model Management & Testing Tools
//!
//! Provides model inspection and estimation tools.
//! Access via: cargo run -p lab -- --cli <command>

use orchestrator::infra::dpt_llmestimator::{DataType, EstimationConfig, HfModelEstimator, quick_estimate};
use orchestrator::infra::models::{ModelFamily, ModelRegistry};
use std::path::Path;

pub async fn run_cli(args: Vec<String>) -> anyhow::Result<()> {
    // Initialize tracing for CLI mode
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    // Skip program name and --cli flag
    let args: Vec<&str> = args.iter()
        .skip(1)
        .filter(|a| *a != "--cli" && *a != "-c")
        .map(|s| s.as_str())
        .collect();

    let command = args.first().copied().unwrap_or("help");

    match command {
        "models" | "m" => cmd_models(),
        "verify" | "v" => cmd_verify(),
        "info" | "i" => {
            let model_id = args.get(1).copied().unwrap_or("");
            cmd_info(model_id);
        }
        "vl" => cmd_vl_models(),
        "estimate" | "e" => {
            let model_id = args.get(1).copied().unwrap_or("");
            let ctx_len = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(4096);
            cmd_estimate(model_id, ctx_len).await;
        }
        "estimate-local" | "el" => {
            let path = args.get(1).copied().unwrap_or("");
            let ctx_len = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(4096);
            cmd_estimate_local(path, ctx_len);
        }
        "quick" | "q" => {
            let params = args.get(1).and_then(|s| s.parse().ok()).unwrap_or(7.0);
            let dtype = args.get(2).map(|s| DataType::from_str(s)).unwrap_or(DataType::F16);
            let ctx_len = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(4096);
            cmd_quick_estimate(params, dtype, ctx_len);
        }
        _ => cmd_help(),
    }

    Ok(())
}

fn cmd_help() {
    println!(r#"
╔══════════════════════════════════════════════════════════════════╗
║          DevPulse Lab CLI - Model Management & Testing           ║
╚══════════════════════════════════════════════════════════════════╝

USAGE:
    cargo run -p lab -- --cli <command>

COMMANDS:
    models, m              List all registered models with memory requirements
    verify, v              Check which models exist on disk
    info, i <id>           Show detailed info for a specific model
    vl                     List VL (vision-language) models only

  MEMORY ESTIMATION:
    estimate, e <repo>     Estimate memory from HF Hub model
                           e.g., estimate Qwen/Qwen2.5-7B-Instruct
    estimate-local, el     Estimate from local GGUF file
                           e.g., estimate-local ./model-q4k.gguf
    quick, q <params>      Quick estimate from param count
                           e.g., quick 7 Q4_K 8192

    help                   Show this help

EXAMPLES:
    cargo run -p lab -- --cli models
    cargo run -p lab -- --cli info qwen3-vl-8b-q6k
    cargo run -p lab -- --cli vl
    cargo run -p lab -- --cli estimate Qwen/Qwen2.5-7B-Instruct
    cargo run -p lab -- --cli estimate Qwen/Qwen2.5-7B-Instruct 8192
    cargo run -p lab -- --cli estimate-local D:\models\qwen-7b-q4k.gguf
    cargo run -p lab -- --cli quick 7 Q4_K 4096

NOTE: For the web-based Lab UI, run without --cli:
    cargo run -p lab
"#);
}

fn cmd_models() {
    let registry = ModelRegistry::new();

    println!("\n╔══════════════════════════════════════════════════════════════════╗");
    println!("║              DevPulse Model Registry                             ║");
    println!("╚══════════════════════════════════════════════════════════════════╝\n");

    registry.print_memory_summary();

    println!("─────────────────────────────────────────────────────────────────────");
    println!("Total registered: {} models", registry.list_all().len());
    println!("Base directory: D:\\localdev\\dp_alpha\\models");
}

fn cmd_verify() {
    let registry = ModelRegistry::new();

    println!("\n=== Model Verification ===\n");

    let mut available = 0;
    let mut missing = 0;

    for spec in registry.list_all() {
        let status = match registry.verify(&spec.id) {
            Ok(_) => {
                available += 1;
                "✓ READY"
            }
            Err(e) => {
                missing += 1;
                println!("  Error: {}", e);
                "✗ MISSING"
            }
        };
        println!("[{}] {} ({})", status, spec.name, spec.id);
    }

    println!("\n─────────────────────────────────────────────────────────────────────");
    println!("Available: {} | Missing: {}", available, missing);
}

fn cmd_info(model_id: &str) {
    if model_id.is_empty() {
        println!("Usage: cargo run -p lab -- --cli info <model-id>");
        println!("\nAvailable models:");
        let registry = ModelRegistry::new();
        for spec in registry.list_all() {
            println!("  - {}", spec.id);
        }
        return;
    }

    let registry = ModelRegistry::new();
    match registry.get(model_id) {
        Some(spec) => {
            println!("\n╔══════════════════════════════════════════════════════════════════╗");
            println!("║  Model: {:<54} ║", spec.name);
            println!("╚══════════════════════════════════════════════════════════════════╝\n");

            println!("ID:       {}", spec.id);
            println!("Family:   {:?}", spec.family);
            println!("Size:     {}", spec.size);
            println!("Variant:  {:?}", spec.variant);
            println!();
            println!("Memory Requirements:");
            println!("  VRAM:     {:.1} GB", spec.memory.vram_gb);
            println!("  RAM:      {:.1} GB", spec.memory.ram_gb);
            println!("  CPU-only: {}", if spec.memory.cpu_capable { "Yes" } else { "No" });
            if let Some(min) = spec.memory.min_vram_gb {
                println!("  Min VRAM: {:.1} GB (partial offload)", min);
            }
            println!();
            println!("Files:");
            for file in &spec.files {
                let path = std::path::Path::new(r"D:\localdev\dp_alpha\models").join(file);
                let status = if path.exists() { "✓" } else { "✗" };
                let size = path.metadata().map(|m| m.len()).unwrap_or(0);
                let size_str = if size > 0 {
                    format!("{:.1} GB", size as f64 / 1_073_741_824.0)
                } else {
                    "N/A".to_string()
                };
                println!("  {} {} ({})", status, file, size_str);
            }
            if let Some(mmproj) = &spec.mmproj {
                let path = std::path::Path::new(r"D:\localdev\dp_alpha\models").join(mmproj);
                let status = if path.exists() { "✓" } else { "✗" };
                let size = path.metadata().map(|m| m.len()).unwrap_or(0);
                let size_str = if size > 0 {
                    format!("{:.1} GB", size as f64 / 1_073_741_824.0)
                } else {
                    "N/A".to_string()
                };
                println!("  {} {} (mmproj, {})", status, mmproj, size_str);
            }
        }
        None => {
            println!("Model not found: {}", model_id);
            println!("\nAvailable models:");
            for spec in registry.list_all() {
                println!("  - {}", spec.id);
            }
        }
    }
}

fn cmd_vl_models() {
    let registry = ModelRegistry::new();
    let vl_models = registry.list_family(ModelFamily::Qwen3VL);

    println!("\n╔══════════════════════════════════════════════════════════════════╗");
    println!("║              Vision-Language Models                              ║");
    println!("╚══════════════════════════════════════════════════════════════════╝\n");

    if vl_models.is_empty() {
        println!("No VL models registered.");
        return;
    }

    for spec in vl_models {
        let status = match registry.verify(&spec.id) {
            Ok(_) => "✓ READY",
            Err(_) => "✗ MISSING",
        };

        println!("┌─────────────────────────────────────────────────────────────────┐");
        println!("│ {} [{}]", spec.name, status);
        println!("├─────────────────────────────────────────────────────────────────┤");
        println!("│ ID:       {}", spec.id);
        println!("│ Params:   {}B", spec.size.params_b);
        println!("│ Quant:    {}", spec.size.quant.as_deref().unwrap_or("None"));
        println!("│ VRAM:     {:.1} GB", spec.memory.vram_gb);
        println!("│ RAM:      {:.1} GB (CPU fallback)", spec.memory.ram_gb);
        println!("│ Min VRAM: {:.1} GB (partial offload)", spec.memory.min_vram_gb.unwrap_or(0.0));
        println!("└─────────────────────────────────────────────────────────────────┘");
        println!();
    }

    println!("─────────────────────────────────────────────────────────────────────");
    println!("Tip: Use 4B model for faster inference on limited VRAM");
    println!("     Use 8B model for better quality when VRAM allows");
}

async fn cmd_estimate(model_id: &str, ctx_len: usize) {
    if model_id.is_empty() {
        println!("Usage: cargo run -p lab -- --cli estimate <hf-repo-id> [ctx_len]");
        println!("Example: cargo run -p lab -- --cli estimate Qwen/Qwen2.5-7B-Instruct 8192");
        return;
    }

    println!("Fetching model info from HuggingFace...");

    let estimator = HfModelEstimator::new();
    let config = EstimationConfig::default().with_context(ctx_len);

    match estimator.estimate_from_hub_with_config(model_id, config).await {
        Ok(estimate) => {
            // MemoryEstimate implements Display
            println!("{}", estimate);
        }
        Err(e) => {
            println!("Error: {}", e);
        }
    }
}

fn cmd_estimate_local(path: &str, ctx_len: usize) {
    if path.is_empty() {
        println!("Usage: cargo run -p lab -- --cli estimate-local <path> [ctx_len]");
        return;
    }

    let path = Path::new(path);
    if !path.exists() {
        println!("File not found: {}", path.display());
        return;
    }

    let estimator = HfModelEstimator::new();
    let config = EstimationConfig::default().with_context(ctx_len);

    match estimator.estimate_from_gguf(path, config) {
        Ok(estimate) => {
            println!("{}", estimate);
        }
        Err(e) => {
            println!("Error: {}", e);
        }
    }
}

fn cmd_quick_estimate(params_b: f64, dtype: DataType, ctx_len: usize) {
    println!("\n=== Quick Memory Estimation ===\n");
    println!("Parameters: {:.1}B", params_b);
    println!("Data type:  {}", dtype);
    println!("Context:    {} tokens", ctx_len);
    println!();

    let estimate = quick_estimate(params_b, dtype, ctx_len);

    // Display breakdown
    println!("Model weights: {:.2} GB", estimate.weights_bytes as f64 / (1024.0 * 1024.0 * 1024.0));
    println!("KV cache:      {:.2} GB", estimate.kv_cache_bytes as f64 / (1024.0 * 1024.0 * 1024.0));
    println!("Activations:   {:.2} GB", estimate.activation_bytes as f64 / (1024.0 * 1024.0 * 1024.0));
    println!("─────────────────────────");
    println!("Total VRAM:    {:.2} GB", estimate.vram_gb);
    println!("Total RAM:     {:.2} GB (CPU inference)", estimate.ram_gb);
}
