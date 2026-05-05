-- ═══════════════════════════════════════════════════════════
-- LESSON ENGINE TABLES — Shared between VibePulse + DevPulse
-- ═══════════════════════════════════════════════════════════
--
-- These tables live in the PROJECT namespace (NS: projects / DB: {project}).
-- VibePulse writes here via lesson-handler.ts.
-- DevPulse reads here via Svelte stores for lesson UI.
--
-- The lesson engine itself is pure TS (platform/lesson-engine/) and
-- can be consumed by any host: VS Code, Svelte, CLI, MCP.

USE NS projects DB devpulse;

-- ── Lesson Progress ──
-- Tracks user progression through individual lessons.
-- Each row = one user session through one lesson.
DEFINE TABLE lesson_progress SCHEMAFULL;
  DEFINE FIELD lesson_id          ON lesson_progress TYPE string;
  DEFINE FIELD pack_id            ON lesson_progress TYPE string;
  DEFINE FIELD current_step_id    ON lesson_progress TYPE string;
  DEFINE FIELD status             ON lesson_progress TYPE string
    ASSERT $value IN ['in_progress', 'completed', 'skipped'];
  DEFINE FIELD steps              ON lesson_progress TYPE array;
  DEFINE FIELD collected_context  ON lesson_progress TYPE object DEFAULT {};
  DEFINE FIELD started_at         ON lesson_progress TYPE datetime DEFAULT time::now();
  DEFINE FIELD completed_at       ON lesson_progress TYPE option<datetime>;
  DEFINE FIELD score              ON lesson_progress TYPE option<int>;
  DEFINE FIELD time_spent_seconds ON lesson_progress TYPE int DEFAULT 0;
  DEFINE FIELD created_at         ON lesson_progress TYPE datetime DEFAULT time::now();
  DEFINE INDEX idx_lp_lesson      ON lesson_progress FIELDS lesson_id;
  DEFINE INDEX idx_lp_pack        ON lesson_progress FIELDS pack_id;
  DEFINE INDEX idx_lp_status      ON lesson_progress FIELDS status;

-- ── Session Replays ──
-- Event log for lesson session playback.
-- Events: step-enter, step-complete, interaction-response, action-executed,
--         gate-pass, gate-fail, branch-taken, video-play, video-pause.
DEFINE TABLE lesson_replays SCHEMAFULL;
  DEFINE FIELD lesson_id          ON lesson_replays TYPE string;
  DEFINE FIELD session_id         ON lesson_replays TYPE string;
  DEFINE FIELD started_at         ON lesson_replays TYPE datetime;
  DEFINE FIELD events             ON lesson_replays TYPE string;  -- JSON-stringified array
  DEFINE FIELD total_duration     ON lesson_replays TYPE int;     -- milliseconds
  DEFINE FIELD created_at         ON lesson_replays TYPE datetime DEFAULT time::now();
  DEFINE INDEX idx_replay_lesson  ON lesson_replays FIELDS lesson_id;
  DEFINE INDEX idx_replay_session ON lesson_replays FIELDS session_id;

-- ── Lesson Context API ──
-- Queryable endpoint for AI context injection.
-- Returns active lessons and collected preferences for prompt enrichment.
-- Usage: SELECT * FROM fn::lesson_context();
DEFINE FUNCTION fn::lesson_context() {
  LET $active = (SELECT lesson_id, pack_id, current_step_id, status
                 FROM lesson_progress
                 WHERE status = 'in_progress' LIMIT 5);
  LET $completed = (SELECT lesson_id, score, completed_at
                    FROM lesson_progress
                    WHERE status = 'completed'
                    ORDER BY completed_at DESC LIMIT 10);
  LET $prefs = (SELECT category, key, value
                FROM preferences
                WHERE category CONTAINS 'lesson:');
  RETURN {
    active_lessons: $active,
    recent_completions: $completed,
    lesson_preferences: $prefs
  };
};
