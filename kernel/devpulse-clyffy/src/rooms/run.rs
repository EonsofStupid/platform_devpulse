//! A room's run (plan 0001 B4.2): its phases in order, round after round,
//! every place asked through its own conversation, then one answer picked.
//!
//! The rules, as the plan records them:
//! - Rounds repeat the phases before the selection phase, up to
//!   `max_rounds`. From round 2 on, phases with visibility `none` are
//!   skipped: first answers are collected independently, once. The
//!   selection phase runs once, at the end.
//! - In a phase each place takes `max_turns` turns; a parallel phase asks
//!   its places at once (none sees the others' answers of that turn), a
//!   sequential one in seat order (pro, con, pro, con).
//! - A round stops the run early when `stability` is on and no author
//!   changed its answer, or `pass_threshold` is on and every critique
//!   reports no defects.
//! - A place is shown what is new since it last spoke, by the phase's
//!   visibility, datamarked; a blind selector sees candidates by letter
//!   only.
//! - Every author turn (its role generates or argues) is a candidate. The
//!   selector names one by letter, `none` or `tie`; a panel's majority wins.
//!
//! The host ([`RoomHost`]) talks to the agents and keeps the turns; this
//! module decides who speaks, what each is shown and what was picked.

use std::collections::{BTreeMap, HashSet};
use std::fmt::Write as _;

use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use super::Visibility;
use super::brief::{Marker, brief, read_output};
use super::role::Stance;
use super::room::{CarryForward, Phase, PhaseMode, Selection};
use super::seating::{Place, SeatedRoom};
use crate::providers::types::ProviderId;

/// What a room runs on: the host asks each place's agent and keeps the
/// turns.
#[async_trait]
pub trait RoomHost: Send + Sync {
    /// Ask one place's agent; the host streams the turn as it comes and
    /// returns the whole answer.
    async fn ask(&self, place: &Place, prompt: &str) -> Result<String>;
    /// A finished turn, for the host to keep.
    async fn record(&self, turn: &RoomTurn) -> Result<()>;
}

/// One finished turn of a place.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct RoomTurn {
    /// Its order in this run, from 1.
    pub seq: u32,
    /// The round it was in, from 1.
    pub round: u32,
    /// The phase it was in.
    pub phase: String,
    /// The place (`answerer-1`).
    pub place: String,
    /// The place's seat.
    pub seat: String,
    /// The seat's role id.
    pub role: String,
    /// The persona's id, when the place has one.
    pub persona: Option<String>,
    /// The agent that answered.
    pub provider: ProviderId,
    /// Its letter as a candidate, when it is one.
    pub candidate: Option<String>,
    /// The answer, as the agent gave it.
    pub text: String,
    /// The JSON object the answer ended with.
    pub output: Option<serde_json::Value>,
    /// How the answer broke its role's output contract.
    pub contract_problem: Option<String>,
    /// Why the agent could not answer.
    pub failed: Option<String>,
}

/// Why the rounds stopped.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum Stopped {
    /// The room's last round ran.
    Rounds,
    /// No author changed its answer in a round.
    Stable,
    /// Every critique reported no defects.
    Passed,
}

/// What the selector picked.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct Pick {
    /// The winning candidate's letter.
    pub winner: Option<String>,
    /// The place that wrote it.
    pub winner_place: Option<String>,
    /// The next best candidate's letter.
    pub runner_up: Option<String>,
    /// The two orders, or the panel, disagreed.
    pub tie: bool,
    /// Why it was picked.
    pub rationale: Vec<String>,
    /// Who disagreed, and why.
    pub dissent: Vec<String>,
    /// Why nothing could be picked.
    pub problem: Option<String>,
}

/// What a router decided.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct Route {
    /// The place it named; absent when there was no valid answer.
    pub place: Option<String>,
    /// Why, in its words.
    pub rationale: Option<String>,
    /// It asked for a Council instead of one place.
    pub escalate: bool,
    /// Why no one could be asked.
    pub problem: Option<String>,
}

/// How a run ended.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct Outcome {
    /// Rounds run.
    pub rounds: u32,
    /// Why they stopped.
    pub stopped: Stopped,
    /// What the selector picked, in a room that picks.
    pub pick: Option<Pick>,
    /// Authors that changed their answer (`pro-1 in round 2`).
    pub flips: Vec<String>,
    /// Where a router sent the question, in a room that routes.
    #[serde(default)]
    pub route: Option<Route>,
}

/// A seated room that runs your questions. It remembers which places have
/// had their brief, so a later question does not repeat it.
pub struct RoomRun {
    seated: SeatedRoom,
    marker: Marker,
    briefed: HashSet<String>,
}

/// What the router's turn decided. Anything but a listed place, other than a
/// request to escalate, is a problem to report rather than a place to ask.
fn read_route(turn: Option<&RoomTurn>, seated: &SeatedRoom) -> Route {
    let problem = |problem: String| Route {
        place: None,
        rationale: None,
        escalate: false,
        problem: Some(problem),
    };
    let Some(turn) = turn else {
        return problem("the router did not answer".to_owned());
    };
    if let Some(failed) = &turn.failed {
        return problem(format!("the router could not answer: {failed}"));
    }
    let Some(output) = &turn.output else {
        let why = turn
            .contract_problem
            .as_deref()
            .unwrap_or("it has no answer");
        return problem(format!("the router's answer could not be read: {why}"));
    };
    let named = output["place"].as_str().unwrap_or_default();
    let rationale = output["rationale"].as_str().map(str::to_owned);
    let escalate = output["escalate"].as_bool().unwrap_or(false);
    if escalate {
        return Route {
            place: None,
            rationale,
            escalate: true,
            problem: None,
        };
    }
    let listed = seated.places.iter().any(|place| {
        place.key() == named && Some(place.seat.as_str()) != seated.room.routing_seat()
    });
    if listed {
        Route {
            place: Some(named.to_owned()),
            rationale,
            escalate: false,
            problem: None,
        }
    } else {
        problem(format!(
            "the router named {named}, which is not a place in this room"
        ))
    }
}

/// This run's turns, and how far each place has been shown them.
#[derive(Default)]
struct Log {
    turns: Vec<RoomTurn>,
    seen: BTreeMap<String, usize>,
    candidates: usize,
}

impl RoomRun {
    /// A run over a seated room.
    #[must_use]
    pub fn new(seated: SeatedRoom) -> Self {
        Self {
            seated,
            marker: Marker::new(),
            briefed: HashSet::new(),
        }
    }

    /// The room and its places.
    #[must_use]
    pub fn seated(&self) -> &SeatedRoom {
        &self.seated
    }

    /// Run the room on one question.
    /// # Errors
    /// Stops before the next phase if a completed turn cannot be kept.
    pub async fn ask(&mut self, question: &str, host: &dyn RoomHost) -> Result<Outcome> {
        let room = self.seated.room.clone();
        if room.routing_seat().is_some() {
            return self.route(question, host).await;
        }
        let selection_phase = room.selection.as_ref().and_then(|selection| {
            room.phases
                .iter()
                .position(|phase| phase.seats.contains(&selection.seat))
        });
        let mut log = Log::default();
        let mut outcome = Outcome {
            rounds: 0,
            stopped: Stopped::Rounds,
            pick: None,
            flips: Vec::new(),
            route: None,
        };
        for round in 1..=room.stop.max_rounds.max(1) {
            let before = log.turns.len();
            for (index, phase) in room.phases.iter().enumerate() {
                if Some(index) == selection_phase
                    || (round > 1 && phase.visibility == Visibility::None)
                {
                    continue;
                }
                self.phase(phase, round, question, &mut log, host).await?;
            }
            if log.turns.len() == before {
                break;
            }
            outcome.rounds = round;
            let changed = changed_authors(&log.turns, round, &self.seated);
            if round > 1 {
                outcome.flips.extend(
                    changed
                        .iter()
                        .map(|place| format!("{place} in round {round}")),
                );
            }
            if room.stop.pass_threshold && passed(&log.turns, round, &self.seated) {
                outcome.stopped = Stopped::Passed;
                break;
            }
            if room.stop.stability && round > 1 && changed.is_empty() {
                outcome.stopped = Stopped::Stable;
                break;
            }
        }
        if let (Some(index), Some(selection)) = (selection_phase, room.selection.as_ref()) {
            outcome.pick = Some(if log.candidates == 0 {
                no_pick("no candidate answered, so there was nothing to pick from")
            } else {
                let phase = &room.phases[index];
                let start = log.turns.len();
                self.phase(phase, outcome.rounds.max(1), question, &mut log, host)
                    .await?;
                pick(&log.turns, &log.turns[start..], selection)
            });
        }
        Ok(outcome)
    }

    /// A router room: the router speaks, then only the place it named. Nobody is
    /// asked on a guess: an answer naming no listed place stops here and says so.
    /// An escalation stops here too; opening the Council is the host's, which owns
    /// seating and saving.
    async fn route(&mut self, question: &str, host: &dyn RoomHost) -> Result<Outcome> {
        let room = self.seated.room.clone();
        let mut log = Log::default();
        if let Some(phase) = room.phases.first() {
            self.phase(phase, 1, question, &mut log, host).await?;
        }
        let route = read_route(log.turns.last(), &self.seated);
        if let Some(place) = route.place.as_ref().filter(|_| !route.escalate) {
            let place = self
                .seated
                .places
                .iter()
                .find(|candidate| candidate.key() == *place)
                .cloned();
            let phase = place.as_ref().and_then(|place| {
                room.phases
                    .iter()
                    .skip(1)
                    .find(|phase| phase.seats.contains(&place.seat))
            });
            if let (Some(place), Some(phase)) = (place, phase) {
                let prompt = self.prompt(&place, phase, 1, question, &mut log);
                let answer = host.ask(&place, &prompt).await;
                finish(&place, phase, 1, answer, &mut log, host).await?;
            }
        }
        Ok(Outcome {
            rounds: 1,
            stopped: Stopped::Rounds,
            pick: None,
            flips: Vec::new(),
            route: Some(route),
        })
    }

    /// One phase of one round.
    async fn phase(
        &mut self,
        phase: &Phase,
        round: u32,
        question: &str,
        log: &mut Log,
        host: &dyn RoomHost,
    ) -> Result<()> {
        let places: Vec<Place> = phase
            .seats
            .iter()
            .flat_map(|seat| self.seated.places_of(seat).cloned().collect::<Vec<_>>())
            .collect();
        for _ in 0..phase.max_turns.max(1) {
            match phase.mode {
                PhaseMode::Parallel => {
                    // Every prompt is made before any answer is in, so no
                    // place sees the others' answers of this turn.
                    let prompts: Vec<String> = places
                        .iter()
                        .map(|place| self.prompt(place, phase, round, question, log))
                        .collect();
                    let answers = futures::future::join_all(
                        places
                            .iter()
                            .zip(&prompts)
                            .map(|(place, prompt)| host.ask(place, prompt)),
                    )
                    .await;
                    let mut failures = Vec::new();
                    for (place, answer) in places.iter().zip(answers) {
                        // All these answers already exist. A failed write must
                        // not discard the other places' completed work.
                        if let Err(error) = finish(place, phase, round, answer, log, host).await {
                            failures.push(format!("{}: {error:#}", place.key()));
                        }
                    }
                    if !failures.is_empty() {
                        anyhow::bail!("{}", failures.join("\n"));
                    }
                }
                PhaseMode::Sequential => {
                    for place in &places {
                        let prompt = self.prompt(place, phase, round, question, log);
                        let answer = host.ask(place, &prompt).await;
                        finish(place, phase, round, answer, log, host).await?;
                    }
                }
            }
        }
        Ok(())
    }

    /// What a place is told on its turn.
    fn prompt(
        &mut self,
        place: &Place,
        phase: &Phase,
        round: u32,
        question: &str,
        log: &mut Log,
    ) -> String {
        let key = place.key();
        let room = &self.seated.room;
        let mut out = String::new();
        if self.briefed.insert(key.clone()) {
            out.push_str(&brief(room, place, &self.marker));
            out.push_str("\n---\n\n");
        }
        let from = log.seen.get(&key).copied().unwrap_or_else(|| {
            let _ = writeln!(out, "The operator's question:\n{question}\n");
            0
        });
        let selection = room
            .selection
            .as_ref()
            .filter(|selection| selection.seat == place.seat);
        let visibility = match selection {
            Some(selection) if selection.blind.0 => Visibility::Anonymized,
            _ => phase.visibility,
        };
        let shown: Vec<String> = log.turns[from..]
            .iter()
            .filter(|turn| turn.place != key && turn.failed.is_none())
            .filter_map(|turn| self.show(turn, visibility))
            .collect();
        if !shown.is_empty() {
            let _ = writeln!(out, "What the room said since you last spoke:\n");
            for framed in shown {
                let _ = writeln!(out, "{framed}\n");
            }
        }
        let _ = write!(out, "Your turn: phase \"{}\", round {round}.", phase.name);
        if let Some(selection) = selection {
            out.push_str(&selector_ask(selection));
        }
        log.seen.insert(key, log.turns.len());
        out
    }

    /// One turn as another place sees it, or nothing.
    fn show(&self, turn: &RoomTurn, visibility: Visibility) -> Option<String> {
        let content = match self.seated.room.carry_forward {
            CarryForward::StructuredOutputs => turn
                .output
                .as_ref()
                .and_then(|output| serde_json::to_string_pretty(output).ok())
                .unwrap_or_else(|| turn.text.clone()),
            CarryForward::FullTranscript => turn.text.clone(),
        };
        match visibility {
            Visibility::None => None,
            Visibility::Anonymized => Some(match &turn.candidate {
                Some(letter) => self
                    .marker
                    .frame(&[("candidate", letter.as_str())], &content),
                None => self
                    .marker
                    .frame(&[("from", "another participant")], &content),
            }),
            Visibility::Full => {
                let place = self.seated.places.iter().find(|p| p.key() == turn.place)?;
                let from = format!("{} · {}", turn.place, place.agent_name());
                let mut attributes =
                    vec![("from", from.as_str()), ("role", place.role.name.as_str())];
                if let Some(letter) = &turn.candidate {
                    attributes.push(("candidate", letter.as_str()));
                }
                Some(self.marker.frame(&attributes, &content))
            }
        }
    }
}

/// What the selector is asked to do on its turn.
fn selector_ask(selection: &Selection) -> String {
    let mut out = String::from(
        "\nYou pick: the candidates are the answers marked candidate=\"A\", \"B\" and so on. \
         Put exactly one letter in \"winner\", the next best in \"runner_up\", your reasons in \
         \"reasons\" and any disagreement in \"dissent\".",
    );
    if selection.swap_order.0 {
        out.push_str(
            " Judge them in the order given, then again in the opposite order; if your two \
             picks differ, put \"tie\" in \"winner\".",
        );
    }
    if selection.allow_none.0 {
        out.push_str(" If none passes the rubric, put \"none\" in \"winner\".");
    }
    out
}

/// Read and keep one answer.
async fn finish(
    place: &Place,
    phase: &Phase,
    round: u32,
    answer: Result<String>,
    log: &mut Log,
    host: &dyn RoomHost,
) -> Result<()> {
    let (text, failed) = match answer {
        Ok(text) => (text, None),
        Err(e) => (String::new(), Some(format!("{e:#}"))),
    };
    let (output, contract_problem) = if failed.is_some() {
        (None, None)
    } else {
        match read_output(&place.role, &text) {
            Ok(output) => (Some(output), None),
            Err(problem) => (None, Some(problem)),
        }
    };
    let candidate = (place.is_author() && failed.is_none()).then(|| {
        log.candidates += 1;
        letter(log.candidates - 1)
    });
    let turn = RoomTurn {
        seq: u32::try_from(log.turns.len() + 1).unwrap_or(u32::MAX),
        round,
        phase: phase.name.clone(),
        place: place.key(),
        seat: place.seat.clone(),
        role: place.role.id.clone(),
        persona: place.persona.as_ref().map(|p| p.id.clone()),
        provider: place.provider,
        candidate,
        text,
        output,
        contract_problem,
        failed,
    };
    let saved = host.record(&turn).await;
    log.turns.push(turn);
    saved
}

/// `0` → `A`, `25` → `Z`, `26` → `AA`.
fn letter(mut index: usize) -> String {
    let mut out = Vec::new();
    loop {
        out.push(char::from(b'A' + u8::try_from(index % 26).unwrap_or(0)));
        if index < 26 {
            break;
        }
        index = index / 26 - 1;
    }
    out.iter().rev().collect()
}

/// The authors whose latest answer of `round` differs from their answer
/// before it: by its `changed` field when the contract has one, otherwise
/// by its text.
fn changed_authors(turns: &[RoomTurn], round: u32, seated: &SeatedRoom) -> Vec<String> {
    let mut changed = Vec::new();
    for place in seated.places.iter().filter(|place| place.is_author()) {
        let key = place.key();
        let mine: Vec<&RoomTurn> = turns
            .iter()
            .filter(|turn| turn.place == key && turn.failed.is_none())
            .collect();
        let Some((latest, earlier)) = mine.split_last() else {
            continue;
        };
        if latest.round != round {
            continue;
        }
        let flag = latest
            .output
            .as_ref()
            .and_then(|output| output.get("changed"))
            .and_then(serde_json::Value::as_bool);
        let did = match (flag, earlier.last()) {
            (Some(flag), _) => flag,
            (None, Some(before)) => before.text.trim() != latest.text.trim(),
            (None, None) => false,
        };
        if did {
            changed.push(key);
        }
    }
    changed
}

/// Every critique of `round` reported no defects (and there was one).
fn passed(turns: &[RoomTurn], round: u32, seated: &SeatedRoom) -> bool {
    let critics: HashSet<String> = seated
        .places
        .iter()
        .filter(|place| place.role.stance == Stance::Critique)
        .map(Place::key)
        .collect();
    let mut critiques = turns
        .iter()
        .filter(|turn| turn.round == round && critics.contains(&turn.place))
        .peekable();
    critiques.peek().is_some()
        && critiques.all(|turn| {
            turn.output
                .as_ref()
                .and_then(|output| output.get("defects"))
                .and_then(serde_json::Value::as_array)
                .is_some_and(Vec::is_empty)
        })
}

fn no_pick(problem: &str) -> Pick {
    Pick {
        winner: None,
        winner_place: None,
        runner_up: None,
        tie: false,
        rationale: Vec::new(),
        dissent: Vec::new(),
        problem: Some(problem.to_owned()),
    }
}

/// What the selector turns picked among the candidates of `turns`.
fn pick(turns: &[RoomTurn], selector_turns: &[RoomTurn], selection: &Selection) -> Pick {
    let text_list = |output: &serde_json::Value, field: &str| -> Vec<String> {
        output
            .get(field)
            .and_then(serde_json::Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .filter_map(serde_json::Value::as_str)
                    .map(str::to_owned)
                    .collect()
            })
            .unwrap_or_default()
    };
    let mut votes: BTreeMap<String, usize> = BTreeMap::new();
    let mut rationale = Vec::new();
    let mut dissent = Vec::new();
    let mut runner_up = None;
    let mut problems = Vec::new();
    for turn in selector_turns {
        let Some(output) = &turn.output else {
            problems.push(match (&turn.failed, &turn.contract_problem) {
                (Some(failed), _) => format!("{} could not answer: {failed}", turn.place),
                (None, Some(problem)) => {
                    format!("{}'s answer broke its form: {problem}", turn.place)
                }
                (None, None) => format!("{} gave no pick", turn.place),
            });
            continue;
        };
        let winner = output
            .get("winner")
            .and_then(serde_json::Value::as_str)
            .map(|w| w.trim().to_owned())
            .unwrap_or_default();
        *votes.entry(normalize(&winner)).or_default() += 1;
        runner_up = output
            .get("runner_up")
            .and_then(serde_json::Value::as_str)
            .map(normalize)
            .filter(|r| !r.is_empty() && r != "none");
        rationale.extend(text_list(output, "reasons"));
        dissent.extend(text_list(output, "dissent"));
    }
    if votes.is_empty() {
        return no_pick(&problems.join("; "));
    }
    let top = votes.values().copied().max().unwrap_or(0);
    let leaders: Vec<&String> = votes
        .iter()
        .filter(|(_, n)| **n == top)
        .map(|(w, _)| w)
        .collect();
    let mut result = Pick {
        winner: None,
        winner_place: None,
        runner_up,
        tie: false,
        rationale,
        dissent,
        problem: None,
    };
    match leaders.as_slice() {
        [winner] if winner.as_str() == "tie" => result.tie = true,
        [winner] if winner.as_str() == "none" => {
            if !selection.allow_none.0 {
                result.problem =
                    Some("the selector picked none, which this room does not allow".to_owned());
            }
        }
        [winner] => match turns
            .iter()
            .find(|turn| turn.candidate.as_deref() == Some(winner.as_str()))
        {
            Some(turn) => {
                result.winner = Some((*winner).clone());
                result.winner_place = Some(turn.place.clone());
            }
            None => {
                result.problem = Some(format!(
                    "the selector picked {winner}, which is not a candidate"
                ));
            }
        },
        _ => result.tie = true,
    }
    result
}

/// `"b"` → `"B"`, `"None"` → `"none"`, `"Tie"` → `"tie"`.
fn normalize(pick: &str) -> String {
    let pick = pick
        .trim()
        .trim_start_matches("Candidate ")
        .trim_start_matches("candidate ");
    match pick.to_ascii_lowercase().as_str() {
        "none" => "none".to_owned(),
        "tie" => "tie".to_owned(),
        _ => pick.to_ascii_uppercase(),
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use std::sync::Mutex;

    use super::*;
    use crate::rooms::Library;
    use crate::rooms::seating::{Assignment, seat};

    /// How a scripted agent answers: `(place key, ask number)` → answer.
    type Answers = Box<dyn Fn(&str, usize) -> Result<String> + Send + Sync>;

    /// A host whose agents answer from a script. It keeps every prompt and
    /// turn.
    struct Script {
        answer: Answers,
        asked: Mutex<Vec<(String, String)>>,
        recorded: Mutex<Vec<RoomTurn>>,
    }

    impl Script {
        fn new(answer: impl Fn(&str, usize) -> Result<String> + Send + Sync + 'static) -> Self {
            Self {
                answer: Box::new(answer),
                asked: Mutex::new(Vec::new()),
                recorded: Mutex::new(Vec::new()),
            }
        }

        fn prompts(&self, place: &str) -> Vec<String> {
            self.asked
                .lock()
                .unwrap()
                .iter()
                .filter(|(p, _)| p == place)
                .map(|(_, prompt)| prompt.clone())
                .collect()
        }

        fn order(&self) -> Vec<String> {
            self.asked
                .lock()
                .unwrap()
                .iter()
                .map(|(p, _)| p.clone())
                .collect()
        }
    }

    #[async_trait]
    impl RoomHost for Script {
        async fn ask(&self, place: &Place, prompt: &str) -> Result<String> {
            let key = place.key();
            let n = {
                let mut asked = self.asked.lock().unwrap();
                asked.push((key.clone(), prompt.to_owned()));
                asked.iter().filter(|(p, _)| *p == key).count()
            };
            (self.answer)(&key, n)
        }

        async fn record(&self, turn: &RoomTurn) -> Result<()> {
            self.recorded.lock().unwrap().push(turn.clone());
            Ok(())
        }
    }

    fn json(value: &serde_json::Value) -> String {
        format!("My answer.\n```json\n{value}\n```")
    }

    fn assign(seat: &str, place: u32, provider: ProviderId) -> Assignment {
        Assignment {
            seat: seat.to_owned(),
            place,
            provider,
            persona: None,
        }
    }

    fn council() -> RoomRun {
        let mut seating: Vec<Assignment> = (0..3)
            .map(|place| assign("answerer", place, ProviderId::ClaudeCode))
            .collect();
        seating.push(assign("selector", 0, ProviderId::Codex));
        RoomRun::new(seat(&Library::bundled(), "council", &seating).expect("seated"))
    }

    struct StorageFailure {
        asked: Mutex<Vec<String>>,
        retained: Mutex<Vec<String>>,
    }

    #[async_trait]
    impl RoomHost for StorageFailure {
        async fn ask(&self, place: &Place, _prompt: &str) -> Result<String> {
            self.asked.lock().unwrap().push(place.key());
            Ok(expert(&place.key()))
        }
        async fn record(&self, turn: &RoomTurn) -> Result<()> {
            self.retained.lock().unwrap().push(turn.text.clone());
            anyhow::bail!("storage unavailable; recovery copy: {}.json", turn.place)
        }
    }

    #[tokio::test]
    async fn a_failed_parallel_write_retains_all_produced_answers_and_never_asks_the_selector() {
        let host = StorageFailure {
            asked: Mutex::new(Vec::new()),
            retained: Mutex::new(Vec::new()),
        };
        let error = council().ask("Q?", &host).await.unwrap_err();
        assert!(error.to_string().contains("storage unavailable"));
        for place in ["answerer-1", "answerer-2", "answerer-3"] {
            assert!(error.to_string().contains(&format!("{place}.json")));
        }
        assert_eq!(
            *host.asked.lock().unwrap(),
            ["answerer-1", "answerer-2", "answerer-3"]
        );
        assert_eq!(host.retained.lock().unwrap().len(), 3);
    }

    #[tokio::test]
    async fn a_failed_sequential_write_stops_before_the_next_place() {
        let mut run = council();
        run.seated.room.phases[0].mode = PhaseMode::Sequential;
        let host = StorageFailure {
            asked: Mutex::new(Vec::new()),
            retained: Mutex::new(Vec::new()),
        };
        assert!(run.ask("Q?", &host).await.is_err());
        assert_eq!(*host.asked.lock().unwrap(), ["answerer-1"]);
        assert_eq!(host.retained.lock().unwrap().len(), 1);
    }

    fn expert(answer: &str) -> String {
        json(&serde_json::json!({"answer": answer, "confidence": "high", "out_of_domain": []}))
    }

    fn router_run() -> RoomRun {
        let library = Library::bundled();
        let seating: Vec<Assignment> = ["router", "code", "facts", "decisions"]
            .into_iter()
            .map(|seat| Assignment {
                seat: seat.to_owned(),
                place: 0,
                provider: ProviderId::ClaudeCode,
                persona: None,
            })
            .collect();
        RoomRun::new(seat(&library, "router", &seating).expect("seated"))
    }

    fn routed(place: &str, escalate: bool) -> String {
        json(&serde_json::json!({
            "place": place, "rationale": "its domain fits", "escalate": escalate
        }))
    }

    fn asked(host: &Script, places: &[&str]) -> Vec<String> {
        places
            .iter()
            .filter(|place| !host.prompts(place).is_empty())
            .map(|place| (*place).to_owned())
            .collect()
    }

    const EXPERTS: [&str; 3] = ["code-1", "facts-1", "decisions-1"];

    #[tokio::test]
    async fn only_the_place_the_router_names_answers() {
        let host = Script::new(|place, _| {
            Ok(if place == "router-1" {
                routed("facts-1", false)
            } else {
                expert("Paris")
            })
        });
        let outcome = router_run().ask("Capital of France?", &host).await.unwrap();

        assert_eq!(asked(&host, &EXPERTS), ["facts-1"]);
        let route = outcome.route.expect("a route");
        assert_eq!(route.place.as_deref(), Some("facts-1"));
        assert_eq!(route.rationale.as_deref(), Some("its domain fits"));
        assert!(!route.escalate);
        assert_eq!(route.problem, None);
        assert!(host.prompts("facts-1")[0].contains("Capital of France?"));
    }

    #[tokio::test]
    async fn the_router_is_told_the_places_it_can_name_with_their_domains() {
        let host = Script::new(|place, _| {
            Ok(if place == "router-1" {
                routed("code-1", false)
            } else {
                expert("It compiles")
            })
        });
        router_run().ask("Does it compile?", &host).await.unwrap();
        let told = &host.prompts("router-1")[0];
        assert!(told.contains("- code-1: software and code"), "{told}");
        assert!(told.contains("- facts-1: research and facts"), "{told}");
        assert!(
            told.contains("- decisions-1: plans and decisions"),
            "{told}"
        );
        // An expert is not told about routing.
        assert!(!host.prompts("code-1")[0].contains("places you can name"));
    }

    #[tokio::test]
    async fn a_place_that_is_not_listed_asks_no_one_and_says_so() {
        for named in ["expert-1", "router-1"] {
            let host = Script::new(move |_, _| Ok(routed(named, false)));
            let outcome = router_run().ask("Q?", &host).await.unwrap();
            assert_eq!(asked(&host, &EXPERTS), Vec::<String>::new());
            let route = outcome.route.expect("a route");
            assert_eq!(route.place, None);
            assert!(route.problem.expect("a problem").contains(named));
        }
    }

    #[tokio::test]
    async fn a_router_with_no_valid_answer_asks_no_one_and_says_so() {
        let host = Script::new(|_, _| Ok("words, with no JSON".to_owned()));
        let outcome = router_run().ask("Q?", &host).await.unwrap();
        assert_eq!(asked(&host, &EXPERTS), Vec::<String>::new());
        let route = outcome.route.expect("a route");
        assert_eq!(route.place, None);
        assert!(route.problem.is_some());
    }

    #[tokio::test]
    async fn escalating_asks_no_expert_and_leaves_the_council_to_the_host() {
        let host = Script::new(|_, _| Ok(routed("code-1", true)));
        let outcome = router_run().ask("Should we?", &host).await.unwrap();
        assert_eq!(asked(&host, &EXPERTS), Vec::<String>::new());
        assert!(outcome.route.expect("a route").escalate);
    }

    fn selector(winner: &str) -> String {
        json(&serde_json::json!({
            "winner": winner, "runner_up": "A", "reasons": ["clearest"], "dissent": []
        }))
    }

    #[tokio::test]
    async fn a_council_answers_blind_and_its_selector_picks_by_letter() {
        let host = Script::new(|place, _| {
            Ok(match place {
                "answerer-1" => expert("Paris"),
                "answerer-2" => expert("Paris, France"),
                "answerer-3" => expert("Lyon"),
                _ => selector("b"),
            })
        });
        let mut run = council();
        let outcome = run
            .ask("What is the capital of France?", &host)
            .await
            .unwrap();

        assert_eq!(outcome.rounds, 1);
        let pick = outcome.pick.expect("a pick");
        assert_eq!(pick.winner.as_deref(), Some("B"));
        assert_eq!(pick.winner_place.as_deref(), Some("answerer-2"));
        assert_eq!(pick.runner_up.as_deref(), Some("A"));
        assert_eq!(pick.rationale, ["clearest"]);

        // Answerers saw no one else; each was briefed once.
        for place in ["answerer-1", "answerer-2", "answerer-3"] {
            let prompts = host.prompts(place);
            assert_eq!(prompts.len(), 1);
            assert!(prompts[0].contains("What is the capital of France?"));
            assert!(!prompts[0].contains("candidate=\""), "{}", prompts[0]);
        }
        // The blind selector saw three candidates by letter, no agent names.
        let selector_prompt = &host.prompts("selector-1")[0];
        for letter in ["candidate=\"A\"", "candidate=\"B\"", "candidate=\"C\""] {
            assert!(selector_prompt.contains(letter), "{selector_prompt}");
        }
        let shown = selector_prompt
            .split_once("What the room said")
            .map(|(_, after)| after)
            .unwrap();
        assert!(!shown.contains("Claude Code"), "{selector_prompt}");
        assert!(selector_prompt.contains("\"tie\""), "swap order is asked");
        assert_eq!(host.recorded.lock().unwrap().len(), 4);

        // A second question does not brief anyone again.
        let _ = run.ask("And of Italy?", &host).await;
        let second = &host.prompts("answerer-1")[1];
        assert!(second.contains("And of Italy?"));
        assert!(!second.contains("Your method"), "{second}");
    }

    #[tokio::test]
    async fn a_selector_that_breaks_its_form_picks_nothing_and_says_why() {
        let host = Script::new(|place, _| {
            Ok(if place == "selector-1" {
                "I like B best.".to_owned()
            } else {
                expert("Paris")
            })
        });
        let pick = council()
            .ask("Q?", &host)
            .await
            .unwrap()
            .pick
            .expect("a pick");
        assert_eq!(pick.winner, None);
        assert!(
            pick.problem
                .as_deref()
                .unwrap_or_default()
                .contains("broke its form"),
            "{pick:?}"
        );
    }

    #[tokio::test]
    async fn a_failed_agent_is_kept_but_is_no_candidate() {
        let host = Script::new(|place, _| match place {
            "answerer-2" => Err(anyhow::anyhow!("not signed in")),
            "selector-1" => Ok(selector("B")),
            _ => Ok(expert("Paris")),
        });
        let outcome = council().ask("Q?", &host).await.unwrap();
        let recorded = host.recorded.lock().unwrap().clone();
        let failed = recorded.iter().find(|t| t.place == "answerer-2").unwrap();
        assert_eq!(failed.failed.as_deref(), Some("not signed in"));
        assert_eq!(failed.candidate, None);
        // A and B are answerer-1 and answerer-3.
        assert_eq!(
            outcome.pick.and_then(|p| p.winner_place).as_deref(),
            Some("answerer-3")
        );
    }

    #[tokio::test]
    async fn a_debate_interleaves_rebuttals_and_stops_when_no_one_changes() {
        let mut run = RoomRun::new(
            seat(
                &Library::bundled(),
                "debate",
                &[
                    assign("pro", 0, ProviderId::ClaudeCode),
                    assign("con", 0, ProviderId::ClaudeCode),
                    assign("judge", 0, ProviderId::Codex),
                ],
            )
            .expect("seated"),
        );
        // Each side changes its answer only on its first rebuttal (its second
        // turn, in round 1), so round 2 changes nothing.
        let host = Script::new(|place, n| {
            Ok(if place == "judge-1" {
                selector("A")
            } else {
                json(&serde_json::json!({
                    "points": ["p"], "rebuttal": "r", "changed": n == 2, "new_evidence": []
                }))
            })
        });
        let outcome = run.ask("Tabs or spaces?", &host).await.unwrap();
        assert_eq!(outcome.stopped, Stopped::Stable);
        assert_eq!(outcome.rounds, 2);
        assert_eq!(
            outcome.flips,
            Vec::<String>::new(),
            "changes in round 1 are no flips"
        );
        assert_eq!(
            host.order(),
            [
                "pro-1", "con-1", // opening, in parallel
                "pro-1", "con-1", "pro-1", "con-1", // round 1 rebuttals
                "pro-1", "con-1", "pro-1", "con-1", // round 2 rebuttals
                "judge-1"
            ]
        );
        // The judge is not blind: it sees who said what.
        assert!(host.prompts("judge-1")[0].contains("pro-1 · Claude Code"));
    }

    #[tokio::test]
    async fn author_and_critic_stop_when_the_critique_passes() {
        let mut run = RoomRun::new(
            seat(
                &Library::bundled(),
                "author-critic",
                &[
                    assign("author", 0, ProviderId::ClaudeCode),
                    assign("critic", 0, ProviderId::Codex),
                    assign("selector", 0, ProviderId::Codex),
                ],
            )
            .expect("seated"),
        );
        let host = Script::new(|place, n| {
            Ok(match place {
                "author-1" => expert(&format!("draft {n}")),
                "critic-1" if n == 1 => json(&serde_json::json!({"defects": [{"what": "vague"}]})),
                "critic-1" => json(&serde_json::json!({"defects": []})),
                _ => selector("B"),
            })
        });
        let outcome = run.ask("Write a tagline.", &host).await.unwrap();
        assert_eq!(outcome.stopped, Stopped::Passed);
        assert_eq!(outcome.rounds, 2);
        let pick = outcome.pick.expect("a pick");
        assert_eq!(pick.winner_place.as_deref(), Some("author-1"));
        assert_eq!(outcome.flips, ["author-1 in round 2"]);
        // Both drafts were candidates for the selector.
        let selector_prompt = &host.prompts("selector-1")[0];
        assert!(selector_prompt.contains("draft 1") && selector_prompt.contains("draft 2"));
    }

    #[test]
    fn letters_go_past_z() {
        assert_eq!(letter(0), "A");
        assert_eq!(letter(25), "Z");
        assert_eq!(letter(26), "AA");
        assert_eq!(letter(27), "AB");
    }
}
