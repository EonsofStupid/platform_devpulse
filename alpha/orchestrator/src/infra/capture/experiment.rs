// orchestrator/src/infra/capture/experiment.rs

//! Experiment tracking for A/B testing
//!
//! Supports comparing:
//! - Local vs API adapters
//! - Different models
//! - Different prompts/configurations
//! - Quality improvements

use serde::{Deserialize, Serialize};

/// Experiment definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Experiment {
    /// Unique experiment ID
    pub id: String,
    /// Human-readable name
    pub name: String,
    /// Description of what's being tested
    pub description: String,
    /// Variants being compared (e.g., ["local", "anthropic"])
    pub variants: Vec<String>,
    /// Metrics to track
    pub metrics: Vec<String>,
    /// Target improvement percentage
    pub target_improvement_pct: Option<f32>,
    /// Created timestamp
    pub created_at: u64,
}

impl Experiment {
    /// Create new experiment
    pub fn new(id: &str, name: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            description: String::new(),
            variants: Vec::new(),
            metrics: vec!["latency_ms".to_string(), "quality_score".to_string()],
            target_improvement_pct: Some(30.0),
            created_at: shared::types::header::current_time_millis(),
        }
    }

    /// Add variant
    pub fn with_variant(mut self, variant: &str) -> Self {
        self.variants.push(variant.to_string());
        self
    }

    /// Set description
    pub fn with_description(mut self, description: &str) -> Self {
        self.description = description.to_string();
        self
    }

    /// Set target improvement
    pub fn with_target(mut self, target_pct: f32) -> Self {
        self.target_improvement_pct = Some(target_pct);
        self
    }

    /// Create a local vs API experiment
    pub fn local_vs_api(id: &str, api_adapter: &str) -> Self {
        Self::new(id, &format!("Local vs {}", api_adapter))
            .with_variant("local")
            .with_variant(api_adapter)
            .with_description(&format!(
                "Compare local Qwen3-VL-4B against {} API for quality and latency",
                api_adapter
            ))
            .with_target(30.0)
    }
}

/// Active experiment run
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentRun {
    /// Experiment definition
    pub experiment: Experiment,
    /// Run tag (used to tag captured signals)
    pub tag: String,
    /// Current variant being tested
    pub current_variant: String,
    /// Run started timestamp
    pub started_at: u64,
    /// Samples collected per variant
    pub samples_collected: std::collections::HashMap<String, u32>,
}

impl ExperimentRun {
    /// Start a new experiment run
    pub fn start(experiment: Experiment) -> Self {
        let tag = format!("{}_{}", experiment.id, shared::types::header::current_time_millis());
        let variants = experiment.variants.clone();
        let current = variants.first().cloned().unwrap_or_default();

        Self {
            experiment,
            tag,
            current_variant: current,
            started_at: shared::types::header::current_time_millis(),
            samples_collected: std::collections::HashMap::new(),
        }
    }

    /// Switch to next variant
    pub fn next_variant(&mut self) -> Option<&str> {
        let current_idx = self.experiment.variants.iter()
            .position(|v| v == &self.current_variant);

        if let Some(idx) = current_idx {
            let next_idx = (idx + 1) % self.experiment.variants.len();
            self.current_variant = self.experiment.variants[next_idx].clone();
            Some(&self.current_variant)
        } else {
            None
        }
    }

    /// Record a sample for current variant
    pub fn record_sample(&mut self) {
        *self.samples_collected
            .entry(self.current_variant.clone())
            .or_insert(0) += 1;
    }

    /// Get samples for a variant
    pub fn samples_for(&self, variant: &str) -> u32 {
        self.samples_collected.get(variant).copied().unwrap_or(0)
    }

    /// Check if enough samples collected
    pub fn has_enough_samples(&self, min_samples: u32) -> bool {
        self.experiment.variants.iter().all(|v| {
            self.samples_collected.get(v).copied().unwrap_or(0) >= min_samples
        })
    }
}

/// Experiment comparison results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentComparison {
    /// Experiment that was compared
    pub experiment_id: String,
    /// Baseline variant (usually "local")
    pub baseline: String,
    /// Test variant (e.g., "anthropic")
    pub test_variant: String,
    /// Metrics comparison
    pub metrics: Vec<MetricComparison>,
    /// Overall improvement percentage
    pub improvement_pct: f32,
    /// Whether target was met
    pub target_met: bool,
    /// Recommendation
    pub recommendation: String,
}

/// Single metric comparison
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricComparison {
    /// Metric name
    pub name: String,
    /// Baseline value
    pub baseline_value: f64,
    /// Test value
    pub test_value: f64,
    /// Improvement percentage (positive = better)
    pub improvement_pct: f32,
    /// Is improvement significant?
    pub significant: bool,
}

impl ExperimentComparison {
    /// Create comparison between two variants
    pub fn compare(
        experiment: &Experiment,
        baseline: &str,
        test: &str,
        baseline_metrics: &VariantMetrics,
        test_metrics: &VariantMetrics,
    ) -> Self {
        let mut metrics = Vec::new();

        // Compare latency (lower is better)
        if let (Some(b_lat), Some(t_lat)) = (baseline_metrics.avg_latency_ms, test_metrics.avg_latency_ms) {
            let improvement = if b_lat > 0.0 {
                ((b_lat - t_lat) / b_lat * 100.0) as f32
            } else {
                0.0
            };
            metrics.push(MetricComparison {
                name: "latency_ms".to_string(),
                baseline_value: b_lat,
                test_value: t_lat,
                improvement_pct: improvement,
                significant: improvement.abs() > 10.0,
            });
        }

        // Compare quality (higher is better)
        if let (Some(b_qual), Some(t_qual)) = (baseline_metrics.avg_quality, test_metrics.avg_quality) {
            let improvement = if b_qual > 0.0 {
                ((t_qual - b_qual) / b_qual * 100.0) as f32
            } else {
                0.0
            };
            metrics.push(MetricComparison {
                name: "quality_score".to_string(),
                baseline_value: b_qual,
                test_value: t_qual,
                improvement_pct: improvement,
                significant: improvement.abs() > 5.0,
            });
        }

        // Calculate overall improvement
        let overall_improvement: f32 = metrics.iter()
            .map(|m| m.improvement_pct)
            .sum::<f32>() / metrics.len().max(1) as f32;

        let target_met = experiment.target_improvement_pct
            .map(|target| overall_improvement >= target)
            .unwrap_or(false);

        let recommendation = if target_met {
            format!(
                "{} shows {:.1}% improvement over {}. Consider using it for production.",
                test, overall_improvement, baseline
            )
        } else if overall_improvement > 0.0 {
            format!(
                "{} shows {:.1}% improvement but doesn't meet {:.1}% target. Continue testing.",
                test, overall_improvement, experiment.target_improvement_pct.unwrap_or(0.0)
            )
        } else {
            format!(
                "{} shows {:.1}% degradation vs {}. Stick with baseline.",
                test, overall_improvement.abs(), baseline
            )
        };

        Self {
            experiment_id: experiment.id.clone(),
            baseline: baseline.to_string(),
            test_variant: test.to_string(),
            metrics,
            improvement_pct: overall_improvement,
            target_met,
            recommendation,
        }
    }
}

/// Aggregated metrics for a variant
#[derive(Debug, Clone, Default)]
pub struct VariantMetrics {
    pub sample_count: u32,
    pub avg_latency_ms: Option<f64>,
    pub avg_quality: Option<f64>,
    pub total_tokens_in: u64,
    pub total_tokens_out: u64,
}
