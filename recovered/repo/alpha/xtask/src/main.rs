//! xtask - DevPulse development tasks
//!
//! Usage: cargo xtask <command>
//!
//! Commands:
//!   dev        - Compile all crates and launch Lab + Desktop
//!   check-all  - Verify all crates compile in dependency order
//!   run        - Run the full DevPulse stack
//!   chat       - Test the chat interface
//!   verify     - Verify models are present
//!   check      - Verify all paths and dependencies
//!   init       - Initialize development environment

use anyhow::Result;
use std::io::{self, Write};
use std::path::Path;
use std::process::{Child, Command, Stdio};

// ============================================================================
// PREREQUISITE CHECKING
// ============================================================================

/// Result of a prerequisite check
struct Prereq {
    name: &'static str,
    status: PrereqStatus,
}

/// Status of a prerequisite
enum PrereqStatus {
    /// Prerequisite met, with version/info string
    Ok(String),
    /// Prerequisite missing, with fix instructions
    Missing(String),
}

/// Check all prerequisites before starting dev environment
fn check_prerequisites(alpha_dir: &str) -> Vec<Prereq> {
    vec![
        check_cargo(),
        check_node(),
        check_npm(),
        check_node_modules(&format!("{}/lab/ui", alpha_dir), "lab/ui"),
        check_node_modules(&format!("{}/desktop", alpha_dir), "desktop"),
    ]
}

fn check_cargo() -> Prereq {
    match Command::new("cargo").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout)
                .trim()
                .replace("cargo ", "");
            Prereq { name: "cargo", status: PrereqStatus::Ok(version) }
        }
        _ => Prereq {
            name: "cargo",
            status: PrereqStatus::Missing(
                "Install Rust from https://rustup.rs".into()
            ),
        },
    }
}

fn check_node() -> Prereq {
    let cmd = if cfg!(windows) { "node.exe" } else { "node" };
    match Command::new(cmd).arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Prereq { name: "node", status: PrereqStatus::Ok(version) }
        }
        _ => Prereq {
            name: "node",
            status: PrereqStatus::Missing(
                "Install Node.js from https://nodejs.org\n       Restart terminal after install".into()
            ),
        },
    }
}

fn check_npm() -> Prereq {
    let (cmd, args) = if cfg!(windows) {
        ("cmd", vec!["/C", "npm", "--version"])
    } else {
        ("npm", vec!["--version"])
    };

    match Command::new(cmd).args(&args).output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Prereq { name: "npm", status: PrereqStatus::Ok(version) }
        }
        _ => Prereq {
            name: "npm",
            status: PrereqStatus::Missing(
                "npm comes with Node.js - reinstall Node from https://nodejs.org".into()
            ),
        },
    }
}

fn check_node_modules(dir: &str, display_name: &'static str) -> Prereq {
    let node_modules = format!("{}/node_modules", dir);
    let package_json = format!("{}/package.json", dir);

    if !std::path::Path::new(&package_json).exists() {
        return Prereq {
            name: display_name,
            status: PrereqStatus::Missing(format!(
                "package.json not found at {}", dir
            )),
        };
    }

    if std::path::Path::new(&node_modules).exists() {
        Prereq { name: display_name, status: PrereqStatus::Ok("deps installed".into()) }
    } else {
        Prereq {
            name: display_name,
            status: PrereqStatus::Missing(format!(
                "Run: cd {} && npm install", dir
            )),
        }
    }
}

// ============================================================================
// PRINT HELPERS
// ============================================================================

/// Print a prerequisite check result. Returns true if OK.
fn print_prereq(prereq: &Prereq) -> bool {
    match &prereq.status {
        PrereqStatus::Ok(info) => {
            println!("  [OK] {:<15} {}", prereq.name, info);
            true
        }
        PrereqStatus::Missing(_) => {
            println!("  [X]  {:<15} MISSING", prereq.name);
            false
        }
    }
}

/// Print step progress
fn print_step(current: usize, total: usize, name: &str, status: &str, detail: &str) {
    let icon = match status {
        "OK" => "[OK]",
        "FAIL" => "[X]",
        "RUN" => "[*]",
        "..." => "[.]",
        _ => "[ ]",
    };

    if detail.is_empty() {
        println!("  {} [{}/{}] {:<20} {}", icon, current, total, name, status);
    } else {
        println!("  {} [{}/{}] {:<20} {} - {}", icon, current, total, name, status, detail);
    }
}

/// Print error with fix instructions
fn print_error_with_fix(title: &str, details: &str, fix_lines: &[&str]) {
    println!();
    println!("ERROR: {}", title);
    if !details.is_empty() {
        println!();
        println!("  {}", details);
    }
    println!();
    println!("  To fix:");
    for line in fix_lines {
        println!("    {}", line);
    }
    println!();
}

// ============================================================================
// PROCESS SPAWNING
// ============================================================================

/// Spawn npm command (Windows-safe)
fn spawn_npm(args: &[&str], dir: &str) -> Result<Child> {
    if cfg!(windows) {
        let mut cmd_args = vec!["/C", "npm"];
        cmd_args.extend(args);
        Command::new("cmd")
            .args(&cmd_args)
            .current_dir(dir)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| anyhow::anyhow!("Failed to spawn npm in {}: {}", dir, e))
    } else {
        Command::new("npm")
            .args(args)
            .current_dir(dir)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| anyhow::anyhow!("Failed to spawn npm in {}: {}", dir, e))
    }
}

/// Running services container - kills all on drop
struct RunningServices {
    lab_backend: Option<Child>,
    lab_ui: Option<Child>,
    desktop: Option<Child>,
}

impl RunningServices {
    fn new() -> Self {
        Self {
            lab_backend: None,
            lab_ui: None,
            desktop: None,
        }
    }

    fn shutdown(&mut self) {
        if let Some(ref mut child) = self.lab_backend {
            let _ = child.kill();
            println!("  [OK] Lab Backend stopped");
        }
        if let Some(ref mut child) = self.lab_ui {
            let _ = child.kill();
            println!("  [OK] Lab UI stopped");
        }
        if let Some(ref mut child) = self.desktop {
            let _ = child.kill();
            println!("  [OK] Desktop stopped");
        }
    }
}

impl Drop for RunningServices {
    fn drop(&mut self) {
        self.shutdown();
    }
}

// ============================================================================
// CMAKE CACHE CLEANING
// ============================================================================

/// Clean stale cmake caches that cause VS version mismatch errors
///
/// This handles the common error:
/// "CMake Error: generator : Visual Studio 17 2022
///  Does not match the generator used previously: Visual Studio 18 2026"
fn clean_cmake_caches(alpha_dir: &str) -> u32 {
    let build_dir = format!("{}/target/debug/build", alpha_dir);
    let build_path = Path::new(&build_dir);

    if !build_path.exists() {
        return 0;
    }

    let mut cleaned = 0u32;

    // Walk the build directory and clean cmake caches
    if let Ok(entries) = std::fs::read_dir(build_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                // Check for CMakeCache.txt in this build directory
                let cmake_cache = path.join("out").join("CMakeCache.txt");
                if cmake_cache.exists() {
                    if let Err(e) = std::fs::remove_file(&cmake_cache) {
                        eprintln!("      Warning: Could not remove {:?}: {}", cmake_cache, e);
                    } else {
                        cleaned += 1;
                    }
                }

                // Also check for CMakeCache.txt directly in the crate build dir
                let cmake_cache_direct = path.join("CMakeCache.txt");
                if cmake_cache_direct.exists() {
                    if let Err(e) = std::fs::remove_file(&cmake_cache_direct) {
                        eprintln!("      Warning: Could not remove {:?}: {}", cmake_cache_direct, e);
                    } else {
                        cleaned += 1;
                    }
                }

                // Remove CMakeFiles directories
                let cmake_files = path.join("out").join("CMakeFiles");
                if cmake_files.exists() && cmake_files.is_dir() {
                    if let Err(e) = std::fs::remove_dir_all(&cmake_files) {
                        eprintln!("      Warning: Could not remove {:?}: {}", cmake_files, e);
                    }
                }

                // Check nested build directories (aws-lc-sys, etc.)
                let nested_build = path.join("out").join("build");
                if nested_build.exists() && nested_build.is_dir() {
                    let nested_cache = nested_build.join("CMakeCache.txt");
                    if nested_cache.exists() {
                        if let Err(e) = std::fs::remove_file(&nested_cache) {
                            eprintln!("      Warning: Could not remove {:?}: {}", nested_cache, e);
                        } else {
                            cleaned += 1;
                        }
                    }
                    let nested_cmake_files = nested_build.join("CMakeFiles");
                    if nested_cmake_files.exists() && nested_cmake_files.is_dir() {
                        if let Err(e) = std::fs::remove_dir_all(&nested_cmake_files) {
                            eprintln!("      Warning: Could not remove {:?}: {}", nested_cmake_files, e);
                        }
                    }
                }
            }
        }
    }

    cleaned
}

// ============================================================================
// MAIN
// ============================================================================

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging (only for commands that need it)
    let args: Vec<String> = std::env::args().collect();
    let command = args.get(1).map(|s| s.as_str()).unwrap_or("help");

    // Only init tracing for commands that use it
    if matches!(command, "run" | "chat" | "verify" | "check" | "init" | "seed") {
        tracing_subscriber::fmt()
            .with_env_filter(
                tracing_subscriber::EnvFilter::from_default_env()
                    .add_directive("xtask=info".parse()?)
                    .add_directive("orchestrator=debug".parse()?)
                    .add_directive("shared=debug".parse()?),
            )
            .init();
    }

    match command {
        "dev" => dev().await?,
        "check-all" => check_all().await?,
        "run" => run().await?,
        "chat" => chat().await?,
        "verify" => verify().await?,
        "check" => check().await?,
        "init" => init().await?,
        "seed" => seed().await?,
        "help" => print_help(),
        _ => print_help(),
    }

    Ok(())
}

// ============================================================================
// DEV COMMAND - Main development environment launcher
// ============================================================================

/// Launch development environment: Lab backend + Lab UI + Desktop
async fn dev() -> Result<()> {
    println!();
    println!("========================================================");
    println!("  DevPulse Dev Environment");
    println!("========================================================");
    println!();

    let alpha_dir = env!("CARGO_MANIFEST_DIR").replace("\\xtask", "");

    // ========================================
    // PHASE 1: Check Prerequisites
    // ========================================
    println!("Phase 1: Checking prerequisites...");
    println!();

    let prereqs = check_prerequisites(&alpha_dir);
    let mut all_ok = true;
    let mut fixes: Vec<(&str, String)> = vec![];

    for prereq in &prereqs {
        if !print_prereq(prereq) {
            all_ok = false;
            if let PrereqStatus::Missing(fix) = &prereq.status {
                fixes.push((prereq.name, fix.clone()));
            }
        }
    }

    if !all_ok {
        println!();
        println!("--------------------------------------------------------");
        println!("  PREREQUISITES MISSING - Fix before continuing:");
        println!("--------------------------------------------------------");
        for (name, fix) in &fixes {
            println!();
            println!("  {}:", name);
            for line in fix.lines() {
                println!("    {}", line);
            }
        }
        println!();
        anyhow::bail!("Prerequisites not met. See above for fixes.");
    }

    println!();
    println!("  All prerequisites OK!");
    println!();

    // ========================================
    // PHASE 2: Clean Stale CMake Caches
    // ========================================
    println!("Phase 2: Cleaning stale cmake caches...");
    let cleaned = clean_cmake_caches(&alpha_dir);
    if cleaned > 0 {
        println!("  Cleaned {} cmake cache(s) (VS version mismatch fix)", cleaned);
    } else {
        println!("  No stale caches found");
    }
    println!();

    // ========================================
    // PHASE 3: Compile Rust Crates
    // ========================================
    println!("Phase 3: Compiling Rust crates...");
    println!();

    let crates = [
        ("shared", "SSOT types"),
        ("orchestrator", "Llm/inference"),
        ("engine", "Hub/facades"),
        ("lab", "Dev dashboard"),
        ("devpulse-desktop", "Desktop app"),
    ];

    for (i, (crate_name, desc)) in crates.iter().enumerate() {
        print!("  [.] [{}/{}] {:<20} compiling...", i + 1, crates.len(), crate_name);
        io::stdout().flush()?;

        let start = std::time::Instant::now();
        let status = Command::new("cargo")
            .args(["build", "-p", crate_name])
            .current_dir(&alpha_dir)
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .status()?;
        let elapsed = start.elapsed().as_secs_f32();

        // Clear line and reprint with result
        print!("\r\x1b[K");

        if status.success() {
            println!("  [OK] [{}/{}] {:<20} compiled ({:.1}s) - {}",
                     i + 1, crates.len(), crate_name, elapsed, desc);
        } else {
            println!("  [X]  [{}/{}] {:<20} FAILED", i + 1, crates.len(), crate_name);
            println!();
            println!("--------------------------------------------------------");
            println!("  COMPILATION FAILED: {}", crate_name);
            println!("--------------------------------------------------------");
            println!();
            // Re-run to show actual errors
            Command::new("cargo")
                .args(["build", "-p", crate_name])
                .current_dir(&alpha_dir)
                .status()?;
            anyhow::bail!("Compilation failed for: {}", crate_name);
        }
    }

    println!();
    println!("  All crates compiled!");
    println!();

    // ========================================
    // PHASE 4: Start Services
    // ========================================
    println!("Phase 4: Starting services...");
    println!();

    let mut services = RunningServices::new();

    // 1. Lab Backend (Axum API)
    print!("  [.] [1/3] Lab Backend          starting...");
    io::stdout().flush()?;

    let lab_backend = Command::new("cargo")
        .args(["run", "-p", "lab"])
        .current_dir(&alpha_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;
    services.lab_backend = Some(lab_backend);

    // Wait for backend to initialize
    tokio::time::sleep(tokio::time::Duration::from_secs(4)).await;
    print!("\r\x1b[K");
    println!("  [*] [1/3] Lab Backend          RUNNING - http://127.0.0.1:3001");

    // 2. Lab UI (SvelteKit)
    print!("  [.] [2/3] Lab UI               starting...");
    io::stdout().flush()?;

    let lab_ui_dir = format!("{}/lab/ui", alpha_dir);
    let lab_ui = spawn_npm(&["run", "dev"], &lab_ui_dir)?;
    services.lab_ui = Some(lab_ui);

    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    print!("\r\x1b[K");
    println!("  [*] [2/3] Lab UI               RUNNING - http://127.0.0.1:5174");

    // Open Lab in browser automatically
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("cmd")
            .args(["/C", "start", "http://127.0.0.1:5174"])
            .spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open")
            .arg("http://127.0.0.1:5174")
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = Command::new("xdg-open")
            .arg("http://127.0.0.1:5174")
            .spawn();
    }

    // 3. Desktop (Tauri)
    print!("  [.] [3/3] Desktop              starting...");
    io::stdout().flush()?;

    let desktop_dir = format!("{}/desktop", alpha_dir);
    let desktop = spawn_npm(&["run", "tauri:dev"], &desktop_dir)?;
    services.desktop = Some(desktop);

    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    print!("\r\x1b[K");
    println!("  [*] [3/3] Desktop              RUNNING - Tauri window");

    // ========================================
    // RUNNING - Wait for Ctrl+C
    // ========================================
    println!();
    println!("========================================================");
    println!("  ALL SERVICES RUNNING");
    println!("========================================================");
    println!();
    println!("  Lab API:     http://127.0.0.1:3001/api/health");
    println!("  Lab UI:      http://127.0.0.1:5174");
    println!("  Desktop:     Tauri window");
    println!();
    println!("  Shortcuts:");
    println!("    Ctrl+G     Toggle chat overlay (Desktop)");
    println!();
    println!("  Press Ctrl+C to stop all services");
    println!();
    println!("========================================================");

    // Wait for shutdown signal
    tokio::signal::ctrl_c().await?;

    println!();
    println!("Shutting down services...");
    println!();

    // services.shutdown() called automatically via Drop

    Ok(())
}

// ============================================================================
// OTHER COMMANDS (unchanged)
// ============================================================================

/// Check all crates compile in dependency order
async fn check_all() -> Result<()> {
    println!("Checking all crates in dependency order...\n");

    let crates = [
        ("shared", "SSOT types"),
        ("orchestrator", "Llm/inference"),
        ("engine", "Hub/facades"),
        ("lab", "Dev dashboard"),
        ("devpulse-desktop", "Desktop app"),
    ];

    let total = crates.len();
    for (i, (crate_name, description)) in crates.iter().enumerate() {
        print_step(i + 1, total, crate_name, "...", "checking");
        io::stdout().flush()?;

        let start = std::time::Instant::now();
        let status = Command::new("cargo")
            .args(["check", "-p", crate_name])
            .current_dir(env!("CARGO_MANIFEST_DIR").replace("\\xtask", ""))
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .status()?;
        let elapsed = start.elapsed().as_secs_f32();

        print!("\r\x1b[K");
        if status.success() {
            print_step(i + 1, total, crate_name, "OK", &format!("{:.1}s - {}", elapsed, description));
        } else {
            print_step(i + 1, total, crate_name, "FAIL", "");
            print_error_with_fix(
                &format!("Compilation failed: {}", crate_name),
                description,
                &[&format!("cargo check -p {}", crate_name)],
            );
            Command::new("cargo")
                .args(["check", "-p", crate_name])
                .current_dir(env!("CARGO_MANIFEST_DIR").replace("\\xtask", ""))
                .status()?;
            anyhow::bail!("Compilation failed for crate: {crate_name}");
        }
    }

    println!("\nAll crates compile successfully!");
    Ok(())
}

async fn run() -> Result<()> {
    tracing::info!("Starting DevPulse...");

    let paths = shared::get_paths();
    paths.ensure_dirs()?;
    tracing::info!("Data dir: {:?}", paths.data_dir);

    let _infra = orchestrator::Infra::init().await?;
    tracing::info!("Infra initialized");

    tracing::info!("DevPulse running. Press Ctrl+C to stop.");

    tokio::signal::ctrl_c().await?;
    tracing::info!("Shutting down...");

    Ok(())
}

async fn check() -> Result<()> {
    tracing::info!("Checking DevPulse configuration...");

    let paths = shared::get_paths();

    println!("Paths:");
    println!("  data_dir:    {:?}", paths.data_dir);
    println!("  config_dir:  {:?}", paths.config_dir);
    println!("  cache_dir:   {:?}", paths.cache_dir);
    println!("  db_dir:      {:?}", paths.db_dir);
    println!("  models_dir:  {:?}", paths.models_dir);
    println!("  global_db:   {:?}", paths.global_db);
    println!("  rro_dir:  {:?}", paths.rro_dir);

    let exists = |p: &std::path::Path| if p.exists() { "OK" } else { "MISSING" };

    println!("\nStatus:");
    println!("  data_dir:   {}", exists(&paths.data_dir));
    println!("  config_dir: {}", exists(&paths.config_dir));
    println!("  models_dir: {}", exists(&paths.models_dir));

    Ok(())
}

async fn init() -> Result<()> {
    tracing::info!("Initializing DevPulse development environment...");

    let paths = shared::get_paths();
    paths.ensure_dirs()?;

    tracing::info!("Created all required directories");
    tracing::info!("DevPulse initialized at: {:?}", paths.data_dir);

    Ok(())
}

async fn chat() -> Result<()> {
    println!("DevPulse Chat Interface");
    println!("=======================");
    println!("Type your message and press Enter. Type 'quit' to exit.\n");

    let engine = orchestrator::ChatEngine::new().await?;
    println!("Session: {}\n", engine.session_id());

    loop {
        print!("You: ");
        io::stdout().flush()?;

        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        let input = input.trim();

        if input.is_empty() {
            continue;
        }

        if input == "quit" || input == "exit" {
            println!("Goodbye!");
            break;
        }

        match engine.send(input).await {
            Ok(response) => {
                println!("\nMaestro: {}\n", response.message);
                println!("(tokens: {}, hops: {})\n", response.tokens_used, response.hops_executed);
            }
            Err(e) => {
                println!("\n[ERROR] {}\n", e);
            }
        }
    }

    Ok(())
}

async fn verify() -> Result<()> {
    println!("DevPulse Model Verification");
    println!("===========================\n");

    let engine = orchestrator::ChatEngine::new().await?;
    let status = engine.verify_models();

    println!("{}", status);

    Ok(())
}

async fn seed() -> Result<()> {
    println!("Seeding RRO with test data...\n");

    use orchestrator::infra::catalog::models::ModelPaths;
    use orchestrator::infra::embedding::embedder::EmbedderBackend;
    use orchestrator::infra::persistence::vector::{VectorStore, VectorPoint, collections};

    let paths = ModelPaths::default_dp_alpha();
    paths.verify_embedder()?;
    println!("Model paths verified");

    print!("Loading embedder... ");
    io::stdout().flush()?;
    let embedder = EmbedderBackend::load(&paths.embedder_dir)?;
    println!("OK (dim: {})", embedder.dimension());

    print!("Starting RRO... ");
    io::stdout().flush()?;
    let vector_store = VectorStore::init()?;
    println!("OK");

    let dim = embedder.dimension() as u64;
    print!("Creating collection '{}' (dim: {})... ", collections::CODE, dim);
    io::stdout().flush()?;
    vector_store.create_collection(collections::CODE, dim).await?;
    println!("OK");

    let chunks = vec![
        ("fn main() { println!(\"Hello, DevPulse!\"); }", "src/main.rs"),
        ("pub struct User { name: String, email: String, created_at: DateTime<Utc> }", "src/models/user.rs"),
        ("async fn fetch_data(client: &Client) -> Result<Data> { client.get(url).await?.json().await }", "src/api/client.rs"),
        ("impl Iterator for ChunkIter { type Item = Chunk; fn next(&mut self) -> Option<Self::Item> { self.inner.next() } }", "src/iter.rs"),
        ("pub trait Handler: Send + Sync { async fn handle(&self, req: Request) -> Response; }", "src/handler.rs"),
        ("#[derive(Debug, Clone, Serialize, Deserialize)] pub struct Config { pub api_key: String, pub model: String }", "src/config.rs"),
        ("fn calculate_similarity(a: &[f32], b: &[f32]) -> f32 { a.iter().zip(b).map(|(x, y)| x * y).sum() }", "src/vector/similarity.rs"),
        ("pub async fn rerank_documents(query: &str, docs: &[Document]) -> Vec<RankedDoc> { /* ... */ }", "src/reranker.rs"),
    ];

    println!("\nEmbedding {} chunks:", chunks.len());
    let mut points = Vec::new();
    for (content, source) in &chunks {
        print!("  {}... ", source);
        io::stdout().flush()?;
        let vec = embedder.embed(content)?;
        println!("OK ({} dims)", vec.len());

        points.push(VectorPoint::new(
            uuid::Uuid::new_v4().to_string(),
            vec,
            serde_json::json!({
                "content": content,
                "source": source,
            }),
        ));
    }

    print!("\nUpserting {} points... ", points.len());
    io::stdout().flush()?;
    vector_store.upsert(collections::CODE, points).await?;
    println!("OK");

    let count = vector_store.count(collections::CODE).await?;
    println!("\nCollection '{}' now has {} points", collections::CODE, count);

    println!("\nSeed complete! Run `cargo xtask chat` to test semantic search.");

    Ok(())
}

fn print_help() {
    println!(
        r#"
DevPulse xtask - Development tasks

USAGE:
    cargo xtask <COMMAND>

COMMANDS:
    dev        Compile all crates and launch Lab + Desktop (MAIN)
    check-all  Verify all crates compile in dependency order
    run        Run the full DevPulse stack
    chat       Test the chat interface (interactive REPL)
    seed       Seed RRO with test data (embeds code chunks)
    verify     Verify all models are present
    check      Verify all paths and dependencies
    init       Initialize development environment
    help       Print this help message

QUICK START:
    cargo xtask dev    # Compile everything and launch dev environment
"#
    );
}
