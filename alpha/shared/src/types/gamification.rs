// shared/src/types/gamification.rs

//! Gamification system types for DevPulse
//!
//! Provides progressive disclosure through competency levels,
//! affective state tracking, and streak-based achievements.
//!
//! ## Design Philosophy
//! - Novice users see layman terms with helpful tooltips
//! - As competency grows, terminology transitions to developer speak
//! - Streaks reward consistent engagement
//! - Affective state influences UI tone and encouragement

use serde::{Deserialize, Serialize};

// ============== Competency Levels ==============

/// User competency level - determines terminology and scaffolding
///
/// Levels progress based on successful interactions and demonstrated understanding.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum CompetencyLevel {
    /// New user - full scaffolding, layman terms only
    #[default]
    Novice,
    /// Some experience - transitional terms with tooltips
    Beginner,
    /// Comfortable - developer terms with optional hints
    Intermediate,
    /// Proficient - minimal scaffolding
    Advanced,
    /// Full developer mode - no scaffolding
    Expert,
}

impl CompetencyLevel {
    /// Get all levels in progression order
    pub fn all() -> &'static [CompetencyLevel] {
        &[
            CompetencyLevel::Novice,
            CompetencyLevel::Beginner,
            CompetencyLevel::Intermediate,
            CompetencyLevel::Advanced,
            CompetencyLevel::Expert,
        ]
    }

    /// Get the next level (None if already Expert)
    pub fn next(&self) -> Option<CompetencyLevel> {
        match self {
            CompetencyLevel::Novice => Some(CompetencyLevel::Beginner),
            CompetencyLevel::Beginner => Some(CompetencyLevel::Intermediate),
            CompetencyLevel::Intermediate => Some(CompetencyLevel::Advanced),
            CompetencyLevel::Advanced => Some(CompetencyLevel::Expert),
            CompetencyLevel::Expert => None,
        }
    }

    /// XP threshold to reach this level
    pub fn xp_threshold(&self) -> u32 {
        match self {
            CompetencyLevel::Novice => 0,
            CompetencyLevel::Beginner => 100,
            CompetencyLevel::Intermediate => 500,
            CompetencyLevel::Advanced => 2000,
            CompetencyLevel::Expert => 5000,
        }
    }

    /// Human-readable display name
    pub fn display_name(&self) -> &'static str {
        match self {
            CompetencyLevel::Novice => "Novice",
            CompetencyLevel::Beginner => "Beginner",
            CompetencyLevel::Intermediate => "Intermediate",
            CompetencyLevel::Advanced => "Advanced",
            CompetencyLevel::Expert => "Expert",
        }
    }
}

// ============== Affective States ==============

/// User's emotional/engagement state based on recent interactions
///
/// Derived from mood_score: success rate over recent interactions.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum AffectiveState {
    /// mood_score < 0.2 - Many failures, needs encouragement
    Enraged,
    /// mood_score 0.2-0.4 - Struggling
    Angry,
    /// mood_score 0.4-0.6 - Mixed results
    #[default]
    Neutral,
    /// mood_score 0.6-0.8 - Going well
    Content,
    /// mood_score > 0.8 - On a roll
    Happy,
}

impl AffectiveState {
    /// Derive affective state from mood score (0.0 - 1.0)
    pub fn from_mood_score(score: f32) -> Self {
        match score {
            s if s < 0.2 => AffectiveState::Enraged,
            s if s < 0.4 => AffectiveState::Angry,
            s if s < 0.6 => AffectiveState::Neutral,
            s if s < 0.8 => AffectiveState::Content,
            _ => AffectiveState::Happy,
        }
    }

    /// Get encouragement message for this state
    pub fn encouragement(&self) -> &'static str {
        match self {
            AffectiveState::Enraged => "Let's take a step back and try a different approach.",
            AffectiveState::Angry => "Don't worry, we'll figure this out together.",
            AffectiveState::Neutral => "You're making progress. Keep going!",
            AffectiveState::Content => "Nice work! You're getting the hang of this.",
            AffectiveState::Happy => "You're on fire! Excellent work!",
        }
    }

    /// Emoji representation for UI
    pub fn emoji(&self) -> &'static str {
        match self {
            AffectiveState::Enraged => "😤",
            AffectiveState::Angry => "😠",
            AffectiveState::Neutral => "😐",
            AffectiveState::Content => "🙂",
            AffectiveState::Happy => "😊",
        }
    }
}

// ============== Streak Milestones ==============

/// Achievement milestones based on consecutive successes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum StreakMilestone {
    /// No streak yet
    #[default]
    None,
    /// 3 consecutive successes
    Foundation,
    /// 5 consecutive successes
    Momentum,
    /// 10 consecutive successes
    Flow,
    /// 15 consecutive successes
    Mastery,
    /// 20+ consecutive successes
    Picasso,
}

impl StreakMilestone {
    /// Determine milestone from streak count
    pub fn from_streak(count: u32) -> Self {
        match count {
            0..=2 => StreakMilestone::None,
            3..=4 => StreakMilestone::Foundation,
            5..=9 => StreakMilestone::Momentum,
            10..=14 => StreakMilestone::Flow,
            15..=19 => StreakMilestone::Mastery,
            _ => StreakMilestone::Picasso,
        }
    }

    /// Streak count required for this milestone
    pub fn required_streak(&self) -> u32 {
        match self {
            StreakMilestone::None => 0,
            StreakMilestone::Foundation => 3,
            StreakMilestone::Momentum => 5,
            StreakMilestone::Flow => 10,
            StreakMilestone::Mastery => 15,
            StreakMilestone::Picasso => 20,
        }
    }

    /// Display name for UI
    pub fn display_name(&self) -> &'static str {
        match self {
            StreakMilestone::None => "No Streak",
            StreakMilestone::Foundation => "Foundation",
            StreakMilestone::Momentum => "Momentum",
            StreakMilestone::Flow => "Flow State",
            StreakMilestone::Mastery => "Mastery",
            StreakMilestone::Picasso => "Picasso",
        }
    }

    /// Achievement message when milestone is reached
    pub fn achievement_message(&self) -> Option<&'static str> {
        match self {
            StreakMilestone::None => None,
            StreakMilestone::Foundation => Some("Building a solid foundation!"),
            StreakMilestone::Momentum => Some("You've got momentum now!"),
            StreakMilestone::Flow => Some("You're in the flow state!"),
            StreakMilestone::Mastery => Some("Approaching mastery!"),
            StreakMilestone::Picasso => Some("Like Picasso - a true artist!"),
        }
    }
}

// ============== Terminology Mapping ==============

/// Terminology presentation level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum TerminologyLevel {
    /// Plain language, no jargon
    #[default]
    Layman,
    /// Mix of plain and technical with explanations
    Transitional,
    /// Full developer terminology
    Developer,
}

impl TerminologyLevel {
    /// Get terminology level from competency
    pub fn from_competency(level: CompetencyLevel) -> Self {
        match level {
            CompetencyLevel::Novice => TerminologyLevel::Layman,
            CompetencyLevel::Beginner => TerminologyLevel::Layman,
            CompetencyLevel::Intermediate => TerminologyLevel::Transitional,
            CompetencyLevel::Advanced => TerminologyLevel::Developer,
            CompetencyLevel::Expert => TerminologyLevel::Developer,
        }
    }
}

/// A term with multiple presentation levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TermDefinition {
    /// Developer term (canonical)
    pub developer: &'static str,
    /// Layman-friendly equivalent
    pub layman: &'static str,
    /// Transitional (layman with developer in parens)
    pub transitional: &'static str,
    /// Tooltip explanation
    pub tooltip: &'static str,
}

impl TermDefinition {
    /// Get the term for a given terminology level
    pub fn for_level(&self, level: TerminologyLevel) -> &'static str {
        match level {
            TerminologyLevel::Layman => self.layman,
            TerminologyLevel::Transitional => self.transitional,
            TerminologyLevel::Developer => self.developer,
        }
    }
}

/// Common terminology mappings
pub mod terms {
    use super::TermDefinition;

    pub const REPOSITORY: TermDefinition = TermDefinition {
        developer: "Repository",
        layman: "Project folder",
        transitional: "Project folder (repository)",
        tooltip: "A repository is a folder that tracks all changes to your code over time.",
    };

    pub const COMMIT: TermDefinition = TermDefinition {
        developer: "Commit",
        layman: "Save point",
        transitional: "Save point (commit)",
        tooltip: "A commit saves a snapshot of your changes that you can return to later.",
    };

    pub const BRANCH: TermDefinition = TermDefinition {
        developer: "Branch",
        layman: "Version",
        transitional: "Version (branch)",
        tooltip: "A branch lets you work on changes without affecting the main code.",
    };

    pub const MERGE: TermDefinition = TermDefinition {
        developer: "Merge",
        layman: "Combine changes",
        transitional: "Combine changes (merge)",
        tooltip: "Merging takes changes from one version and adds them to another.",
    };

    pub const PULL_REQUEST: TermDefinition = TermDefinition {
        developer: "Pull Request",
        layman: "Change proposal",
        transitional: "Change proposal (pull request)",
        tooltip: "A pull request asks others to review and accept your changes.",
    };

    pub const VECTOR_EMBEDDING: TermDefinition = TermDefinition {
        developer: "Vector embedding",
        layman: "Meaning fingerprint",
        transitional: "Meaning fingerprint (vector)",
        tooltip: "A way to represent text as numbers so the AI can find similar content.",
    };

    pub const RETRIEVAL: TermDefinition = TermDefinition {
        developer: "RAG retrieval",
        layman: "Finding relevant info",
        transitional: "Finding relevant info (retrieval)",
        tooltip: "The AI searches your codebase to find information relevant to your question.",
    };

    pub const INFERENCE: TermDefinition = TermDefinition {
        developer: "Inference",
        layman: "AI thinking",
        transitional: "AI thinking (inference)",
        tooltip: "When the AI processes your input and generates a response.",
    };

    pub const RERANKING: TermDefinition = TermDefinition {
        developer: "Reranking",
        layman: "Sorting by relevance",
        transitional: "Sorting by relevance (reranking)",
        tooltip: "A second pass that picks the most relevant results from initial matches.",
    };
}

// ============== User State ==============

/// Complete user competency tracking state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserCompetencyState {
    /// Current competency level
    pub level: CompetencyLevel,
    /// Total experience points
    pub xp: u32,
    /// Current streak count
    pub streak: u32,
    /// Highest streak achieved
    pub best_streak: u32,
    /// Recent mood score (0.0 - 1.0)
    pub mood_score: f32,
    /// Total successful interactions
    pub successes: u32,
    /// Total interactions
    pub total_interactions: u32,
}

impl Default for UserCompetencyState {
    fn default() -> Self {
        Self {
            level: CompetencyLevel::Novice,
            xp: 0,
            streak: 0,
            best_streak: 0,
            mood_score: 0.5,
            successes: 0,
            total_interactions: 0,
        }
    }
}

impl UserCompetencyState {
    /// Record a successful interaction
    pub fn record_success(&mut self, xp_earned: u32) {
        self.successes += 1;
        self.total_interactions += 1;
        self.streak += 1;
        self.xp += xp_earned;

        if self.streak > self.best_streak {
            self.best_streak = self.streak;
        }

        self.update_mood();
        self.check_level_up();
    }

    /// Record a failed interaction
    pub fn record_failure(&mut self) {
        self.total_interactions += 1;
        self.streak = 0;
        self.update_mood();
    }

    /// Get current affective state
    pub fn affective_state(&self) -> AffectiveState {
        AffectiveState::from_mood_score(self.mood_score)
    }

    /// Get current streak milestone
    pub fn streak_milestone(&self) -> StreakMilestone {
        StreakMilestone::from_streak(self.streak)
    }

    /// Get terminology level based on competency
    pub fn terminology_level(&self) -> TerminologyLevel {
        TerminologyLevel::from_competency(self.level)
    }

    /// XP needed for next level (None if Expert)
    pub fn xp_to_next_level(&self) -> Option<u32> {
        self.level.next().map(|next| {
            let threshold = next.xp_threshold();
            threshold.saturating_sub(self.xp)
        })
    }

    /// Progress percentage to next level (0.0 - 1.0)
    pub fn level_progress(&self) -> f32 {
        let current_threshold = self.level.xp_threshold();
        let next_threshold = self.level.next().map(|l| l.xp_threshold()).unwrap_or(self.xp);

        if next_threshold == current_threshold {
            return 1.0;
        }

        let progress = self.xp.saturating_sub(current_threshold) as f32;
        let range = (next_threshold - current_threshold) as f32;
        (progress / range).clamp(0.0, 1.0)
    }

    fn update_mood(&mut self) {
        if self.total_interactions == 0 {
            self.mood_score = 0.5;
            return;
        }
        // Use recent window (last ~10 interactions weighted)
        let recent_rate = self.successes as f32 / self.total_interactions as f32;
        // Smooth transition
        self.mood_score = self.mood_score * 0.7 + recent_rate * 0.3;
    }

    fn check_level_up(&mut self) {
        while let Some(next) = self.level.next() {
            if self.xp >= next.xp_threshold() {
                self.level = next;
            } else {
                break;
            }
        }
    }
}

// ============== Scaffolding Config ==============

/// UI scaffolding configuration per competency level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScaffoldingConfig {
    /// Show tooltips on hover
    pub show_tooltips: bool,
    /// Show explanatory popups for new concepts
    pub show_explanations: bool,
    /// Show step-by-step guidance
    pub show_guidance: bool,
    /// Terminology level for this config
    pub terminology: TerminologyLevel,
    /// Show streak/achievement notifications
    pub show_achievements: bool,
    /// Show progress indicators
    pub show_progress: bool,
}

impl ScaffoldingConfig {
    /// Get scaffolding config for a competency level
    pub fn for_level(level: CompetencyLevel) -> Self {
        match level {
            CompetencyLevel::Novice => Self {
                show_tooltips: true,
                show_explanations: true,
                show_guidance: true,
                terminology: TerminologyLevel::Layman,
                show_achievements: true,
                show_progress: true,
            },
            CompetencyLevel::Beginner => Self {
                show_tooltips: true,
                show_explanations: true,
                show_guidance: true,
                terminology: TerminologyLevel::Layman,
                show_achievements: true,
                show_progress: true,
            },
            CompetencyLevel::Intermediate => Self {
                show_tooltips: true,
                show_explanations: false,
                show_guidance: false,
                terminology: TerminologyLevel::Transitional,
                show_achievements: true,
                show_progress: true,
            },
            CompetencyLevel::Advanced => Self {
                show_tooltips: false,
                show_explanations: false,
                show_guidance: false,
                terminology: TerminologyLevel::Developer,
                show_achievements: true,
                show_progress: false,
            },
            CompetencyLevel::Expert => Self {
                show_tooltips: false,
                show_explanations: false,
                show_guidance: false,
                terminology: TerminologyLevel::Developer,
                show_achievements: false,
                show_progress: false,
            },
        }
    }
}

// ============== ROTI Metrics ==============

/// Return on Time Invested tracking
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RotiMetrics {
    /// Total time spent in app (seconds)
    pub total_time_seconds: u64,
    /// Estimated time saved (seconds)
    pub time_saved_seconds: u64,
    /// Tasks completed with AI assistance
    pub assisted_tasks: u32,
    /// Code suggestions accepted
    pub suggestions_accepted: u32,
    /// Code suggestions rejected
    pub suggestions_rejected: u32,
}

impl RotiMetrics {
    /// Calculate ROTI ratio (time_saved / time_invested)
    pub fn roti_ratio(&self) -> f32 {
        if self.total_time_seconds == 0 {
            return 0.0;
        }
        self.time_saved_seconds as f32 / self.total_time_seconds as f32
    }

    /// Suggestion acceptance rate
    pub fn acceptance_rate(&self) -> f32 {
        let total = self.suggestions_accepted + self.suggestions_rejected;
        if total == 0 {
            return 0.0;
        }
        self.suggestions_accepted as f32 / total as f32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_competency_level_progression() {
        assert_eq!(CompetencyLevel::Novice.next(), Some(CompetencyLevel::Beginner));
        assert_eq!(CompetencyLevel::Expert.next(), None);
    }

    #[test]
    fn test_competency_xp_thresholds() {
        assert_eq!(CompetencyLevel::Novice.xp_threshold(), 0);
        assert_eq!(CompetencyLevel::Expert.xp_threshold(), 5000);
    }

    #[test]
    fn test_affective_state_from_mood() {
        assert_eq!(AffectiveState::from_mood_score(0.1), AffectiveState::Enraged);
        assert_eq!(AffectiveState::from_mood_score(0.3), AffectiveState::Angry);
        assert_eq!(AffectiveState::from_mood_score(0.5), AffectiveState::Neutral);
        assert_eq!(AffectiveState::from_mood_score(0.7), AffectiveState::Content);
        assert_eq!(AffectiveState::from_mood_score(0.9), AffectiveState::Happy);
    }

    #[test]
    fn test_streak_milestone() {
        assert_eq!(StreakMilestone::from_streak(0), StreakMilestone::None);
        assert_eq!(StreakMilestone::from_streak(3), StreakMilestone::Foundation);
        assert_eq!(StreakMilestone::from_streak(5), StreakMilestone::Momentum);
        assert_eq!(StreakMilestone::from_streak(10), StreakMilestone::Flow);
        assert_eq!(StreakMilestone::from_streak(15), StreakMilestone::Mastery);
        assert_eq!(StreakMilestone::from_streak(25), StreakMilestone::Picasso);
    }

    #[test]
    fn test_terminology_level_from_competency() {
        assert_eq!(
            TerminologyLevel::from_competency(CompetencyLevel::Novice),
            TerminologyLevel::Layman
        );
        assert_eq!(
            TerminologyLevel::from_competency(CompetencyLevel::Intermediate),
            TerminologyLevel::Transitional
        );
        assert_eq!(
            TerminologyLevel::from_competency(CompetencyLevel::Expert),
            TerminologyLevel::Developer
        );
    }

    #[test]
    fn test_term_definition() {
        let term = &terms::REPOSITORY;
        assert_eq!(term.for_level(TerminologyLevel::Layman), "Project folder");
        assert_eq!(
            term.for_level(TerminologyLevel::Transitional),
            "Project folder (repository)"
        );
        assert_eq!(term.for_level(TerminologyLevel::Developer), "Repository");
    }

    #[test]
    fn test_user_state_success() {
        let mut state = UserCompetencyState::default();
        assert_eq!(state.level, CompetencyLevel::Novice);
        assert_eq!(state.streak, 0);

        state.record_success(50);
        assert_eq!(state.streak, 1);
        assert_eq!(state.xp, 50);
        assert_eq!(state.successes, 1);

        // Multiple successes
        for _ in 0..3 {
            state.record_success(50);
        }
        assert_eq!(state.streak, 4);
        assert_eq!(state.streak_milestone(), StreakMilestone::Foundation);
    }

    #[test]
    fn test_user_state_failure_resets_streak() {
        let mut state = UserCompetencyState::default();
        state.record_success(10);
        state.record_success(10);
        assert_eq!(state.streak, 2);

        state.record_failure();
        assert_eq!(state.streak, 0);
        assert_eq!(state.xp, 20); // XP not lost
    }

    #[test]
    fn test_user_state_level_up() {
        let mut state = UserCompetencyState::default();

        // Give enough XP to reach Beginner (100)
        state.record_success(100);
        assert_eq!(state.level, CompetencyLevel::Beginner);

        // Give enough to reach Intermediate (500)
        for _ in 0..8 {
            state.record_success(50);
        }
        assert_eq!(state.level, CompetencyLevel::Intermediate);
    }

    #[test]
    fn test_scaffolding_config() {
        let novice = ScaffoldingConfig::for_level(CompetencyLevel::Novice);
        assert!(novice.show_tooltips);
        assert!(novice.show_explanations);
        assert_eq!(novice.terminology, TerminologyLevel::Layman);

        let expert = ScaffoldingConfig::for_level(CompetencyLevel::Expert);
        assert!(!expert.show_tooltips);
        assert!(!expert.show_explanations);
        assert_eq!(expert.terminology, TerminologyLevel::Developer);
    }

    #[test]
    fn test_roti_metrics() {
        let mut roti = RotiMetrics::default();
        roti.total_time_seconds = 3600; // 1 hour
        roti.time_saved_seconds = 7200; // 2 hours saved
        roti.suggestions_accepted = 8;
        roti.suggestions_rejected = 2;

        assert!((roti.roti_ratio() - 2.0).abs() < 0.001);
        assert!((roti.acceptance_rate() - 0.8).abs() < 0.001);
    }

    #[test]
    fn test_user_state_serialization() {
        let mut state = UserCompetencyState::default();
        state.record_success(150);

        let json = serde_json::to_string(&state).unwrap();
        let restored: UserCompetencyState = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.level, state.level);
        assert_eq!(restored.xp, state.xp);
        assert_eq!(restored.streak, state.streak);
    }
}
