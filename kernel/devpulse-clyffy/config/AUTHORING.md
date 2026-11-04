# Adding your own roles, rooms and personas

DevPulse ships a library you can use as it is or start from. Everything in it is a
plain JSON file in this folder, in the same shape as a file you would write.
Yours go in `{data folder}/config/{roles,rooms,personas}/<id>.json`, or you can make
them from the chat window. A file that does not pass is never loaded half-way: the
library names it and says what is wrong.

The formal definitions are in [`schemas/`](schemas/). The research behind the shipped
library is in `docs/research/chat-rooms-and-roles.md`.

| What | Answers | Example |
| --- | --- | --- |
| **Role** | What job does this seat do, and what must it produce? | Code Reviewer |
| **Room** | Who sits where, in what order, and how does it end? | Council, Round Robin Group |
| **Persona** | Who is the character speaking? | Rusty the goat |

A role is the job and a persona is the character. Keep them apart: the same role can
speak as any persona, and a persona never changes the role's method or limits.

## The smallest role

A role is defined by its method and its output contract, not by a backstory.

```json
{
  "schema": "dpl.role/1",
  "id": "changelog-writer",
  "version": "1.0.0",
  "name": "Changelog Writer",
  "summary": "Turns a list of changes into a changelog people want to read.",
  "purpose": "Say what changed for the person using it.",
  "stance": "generate",
  "method": { "name": "User-facing changes first", "steps": ["Group changes by what the person notices."] },
  "instructions": "You are a Changelog Writer. Say what changed for the person using it, in plain words.",
  "must_not": ["invent a change"],
  "output_contract": {
    "type": "object",
    "required": ["changelog"],
    "properties": { "changelog": { "type": "string" } }
  },
  "rubric": ["Every line is something the person would notice"],
  "speaks_when": ["answer"],
  "visibility": "full",
  "permissions": { "talk_only": true, "tools_allowed": [] },
  "model_prefs": { "avoid_same_vendor_as": [] },
  "budget": { "max_turns": 1 },
  "tags": ["writing"],
  "provenance": { "sources": ["53"], "evidence": "practice", "note": "Your own." }
}
```

The fields that decide how it behaves:

- **`stance`**: `generate`, `ground`, `critique`, `adversarial`, `plan` or `select`. A
  `critique` role whose contract has a `defects` list can end a room when it finds none.
- **`output_contract`**: a JSON Schema. Every answer ends with a JSON block checked
  against it, and a violation is reported at its path.
- **`permissions`**: `talk_only: true` means no tools and no files. Otherwise
  `tools_allowed` lists what the seat may do: `read` (the project's files), `web`,
  `write`. Without `write`, it can look and cannot change anything.
- **`parameters`**: values a room fills in, used in the text as `{name}`. Declare each
  one you use, and use each one you declare.

## The smallest room

A room starts from any role in the library.

```json
{
  "schema": "dpl.room/1",
  "id": "my-reviewers",
  "version": "1.0.0",
  "name": "My Reviewers",
  "type": "round-robin",
  "summary": "Two reviewers take turns on the same code.",
  "seats": [
    { "seat": "reviewer", "role": "code-reviewer@1", "count": 1 },
    { "seat": "security", "role": "security-auditor@1", "count": 1, "notes": false }
  ],
  "phases": [
    { "name": "turn", "seats": ["reviewer", "security"], "mode": "sequential", "visibility": "full", "max_turns": 1 }
  ],
  "turn_policy": "round-robin",
  "stop": { "max_rounds": 2 },
  "carry_forward": "full-transcript",
  "record": ["flips"],
  "provenance": { "sources": ["48"], "evidence": "practice", "note": "Your own." }
}
```

- **`type`** sets the shape: `council`, `debate`, `author-critic`, `router`, `brainstorm`
  or `round-robin`. Each has its own rules, and the library says when a room breaks them.
- **`seats[].notes`**: whether the seat gets the notes you chose. It defaults to yes.
  You can change it per place whenever you seat the room.
- **`seats[].personas`**: the characters that sit there by default, one per place.
- **`seats[].summary`**: one line a Router reads to choose this seat.
- A room with a `selection` picks one answer, and its selection seat must be a role
  with the `select` stance: select, never blend.
- A seat that answers blind, like a Council's answerers, may read but gets no memory
  tools and cannot hold a role with `write`: another seat could read what it left. A
  selector is told what each candidate was allowed to do, and never who it is.

## The smallest persona

```json
{
  "schema": "dpl.persona/1",
  "id": "ada",
  "version": "1.0.0",
  "name": "Ada",
  "summary": "Patient and precise.",
  "tone": "concise",
  "backstory": "Ada has reviewed code for thirty years and still reads every line.",
  "expertise": ["code review"]
}
```

`tone` is `objective`, `empathetic`, `strict` or `concise`. `instructions`, `tags`,
`origin` (where a character comes from) and `style` (`formality`, `verbosity` and
`confidence`, each out of 100) are optional.

## Replacing what ships

Use a new `id` to add alongside, which is what starting from a template does. To
replace a bundled entry, use its `id` with a higher `version`; deleting your file
brings the bundled one back.
