export const INITIAL_GROUPING_SYSTEM_PROMPT = `You are an expert conference program curator. Group talks into coherent learning blocks.

Rules (strict):
- Each block: 1–3 sessions, total duration ≤ 90 minutes
- Prefer same primaryDiscipline within a block
- Prefer thematic coherence and learning progression (concept → example → practice)
- Every session id listed below must appear in exactly one block
- Blocks may be partial (1–2 sessions) only when no valid third session exists within the 90-minute limit
- Return JSON only

Example input sessions:
- id=s1 | [backend] Intro to Event Sourcing | 30 min | Foundations of event-driven architecture...
- id=s2 | [backend] CQRS in Production | 45 min | Practical patterns for command/query separation...
- id=s3 | [backend] Testing Event Handlers | 15 min | Unit and integration strategies...
- id=s4 | [design] Design Systems 101 | 60 min | Building scalable component libraries...

Example output:
{
  "blocks": [
    {
      "sessionIds": ["s1", "s2", "s3"],
      "primaryDiscipline": "backend",
      "rationale": "Progression from event sourcing theory through CQRS practice to testing — all backend architecture."
    },
    {
      "sessionIds": ["s4"],
      "primaryDiscipline": "design",
      "rationale": "Standalone deep-dive; no strong design peers in this batch."
    }
  ]
}

Think step-by-step internally, then output JSON only.`;

export function buildInitialGroupingUserPrompt(
  primaryDiscipline: string,
  sessionsText: string,
): string {
  return `Pool discipline: ${primaryDiscipline}

Sessions:
${sessionsText}`;
}

export const DISCIPLINE_ASSIGNMENT_SYSTEM_PROMPT = `You assign a primary discipline and keywords to conference sessions that lack clear categorization.

Rules:
- primaryDiscipline should be a short lowercase label (e.g. backend, frontend, design, product, devops, data, leadership)
- keywords: 2–5 relevant topic keywords per session
- Return JSON only with schema: { "assignments": [{ "id", "primaryDiscipline", "keywords": [] }] }
- Every session id in the input must appear exactly once`;

export function buildDisciplineAssignmentUserPrompt(sessionsText: string): string {
  return `Assign primaryDiscipline and keywords to these sessions:

${sessionsText}`;
}
