import { evaluateBlock } from "@programionize/block-rules";
import { isHiddenFromCatalog, type CatalogSession } from "./sessions";
import type { BlockView } from "../components/BlockPanel";

export function sessionFitsBlock(
  session: CatalogSession,
  block: BlockView,
): boolean {
  const isAlreadyInBlock = block.sessions.some((s) => s._id === session._id);
  if (isAlreadyInBlock) return true;

  const length = session.lengthMinutes ?? 0;
  return block.sessionCount < 3 && block.totalMinutes + length <= 90;
}

export function previewBlockAfterDrop(
  block: BlockView,
  session: CatalogSession,
): { totalMinutes: number; warnings: ReturnType<typeof evaluateBlock>["warnings"] } {
  const isAlreadyInBlock = block.sessions.some((s) => s._id === session._id);
  const sessions = isAlreadyInBlock
    ? block.sessions
    : [...block.sessions, session];

  const inputs = sessions.map((s) => ({
    lengthMinutes: s.lengthMinutes,
    status: s.status,
    hiddenFromCatalog: isHiddenFromCatalog(s),
  }));

  const totalMinutes = sessions.reduce(
    (sum, s) => sum + (s.lengthMinutes ?? 0),
    0,
  );

  return {
    totalMinutes,
    warnings: evaluateBlock(inputs).warnings,
  };
}

export function dragHintMessage(
  block: BlockView,
  session: CatalogSession,
  aiFitLabel?: "strong" | "ok" | "weak",
): string | null {
  const preview = previewBlockAfterDrop(block, session);

  if (aiFitLabel) {
    const fitText =
      aiFitLabel === "strong"
        ? "Strong AI fit"
        : aiFitLabel === "ok"
          ? "OK AI fit"
          : "Weak AI fit";
    if (!sessionFitsBlock(session, block)) {
      return `${fitText} · would be ${preview.totalMinutes} min`;
    }
    return fitText;
  }

  if (!sessionFitsBlock(session, block)) {
    if (block.sessionCount >= 3 && !block.sessions.some((s) => s._id === session._id)) {
      return `"${block.label ?? "Block"}" already has 3 sessions`;
    }
    return `"${block.label ?? "Block"}" would be ${preview.totalMinutes} min`;
  }

  const durationWarning = preview.warnings.find(
    (w) => w.code === "duration_too_long" || w.code === "duration_too_short",
  );
  if (durationWarning) {
    return `"${block.label ?? "Block"}" would be ${preview.totalMinutes} min`;
  }

  return null;
}
