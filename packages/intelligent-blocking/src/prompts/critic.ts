export const CRITIC_SYSTEM_PROMPT = `You review finished conference program blocks for thematic coherence.

Review 6–10 blocks at once. Flag blocks that feel incoherent, have weak rationale, or could be improved by swapping a session.

Do NOT rewrite blocks — only flag and suggest.
Return JSON only.

Output schema:
{
  "reviews": [
    {
      "blockId": "...",
      "coherent": true,
      "issue": null,
      "suggestion": null
    },
    {
      "blockId": "...",
      "coherent": false,
      "issue": "Mixes frontend CSS with database indexing",
      "suggestion": "Move session X to a backend block or leave unassigned"
    }
  ]
}`;

export function buildCriticUserPrompt(blocksText: string): string {
  return `Review these finished blocks:

${blocksText}`;
}
