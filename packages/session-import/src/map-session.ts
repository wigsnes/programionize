import type { CategoryAll, SessionALl, SessionizeAll } from "sessionize_api";
import { parseLengthMinutes } from "./parse-length.js";
import type { ImportedSession } from "./types.js";

type CategoryLookup = { name: string; key: string };

/** Sessionize uses category title (e.g. "Field"); `type` is often the generic "session". */
function categoryKey(category: CategoryAll): string {
  if (category.title) return category.title;
  if (category.type && category.type !== "session") return category.type;
  return category.type ?? "";
}

function buildCategoryLookups(
  session: SessionALl,
  categories: CategoryAll[],
): CategoryLookup[] {
  return session.categoryItems
    .map((itemId) => {
      for (const category of categories) {
        const item = category.items?.find((entry) => entry.id === itemId);
        if (item) {
          return {
            name: item.name,
            key: categoryKey(category),
          };
        }
      }
      return null;
    })
    .filter((entry): entry is CategoryLookup => entry !== null);
}

export function mapAllSessions(data: SessionizeAll): ImportedSession[] {
  const speakerById = new Map(
    data.speakers.map((speaker) => [speaker.id, speaker.fullName]),
  );

  return data.sessions.map((session) => {
    const lookups = buildCategoryLookups(session, data.categories);
    const field =
      lookups.find((entry) => entry.key === "Field")?.name ?? null;
    const language =
      lookups.find(
        (entry) => entry.key === "Language" || entry.key === "Språk",
      )?.name ?? null;
    const lengthLabel =
      lookups.find((entry) => entry.key === "Session length")?.name ?? null;

    return {
      sessionizeId: session.id,
      title: session.title,
      description: session.description,
      field,
      language,
      lengthMinutes: parseLengthMinutes(lengthLabel),
      isServiceSession: session.isServiceSession,
      speakerNames: session.speakers
        .map((id) => speakerById.get(id))
        .filter((name): name is string => Boolean(name)),
      sessionizeStatus: session.status,
      status: "active" as const,
    };
  });
}
