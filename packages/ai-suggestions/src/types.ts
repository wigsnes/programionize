export type SuggestionInputSession = {
  sessionizeId: string;
  title: string;
  description: string | null;
  lengthMinutes: number | null;
  field: string | null;
  speakerNames: string[];
};

export type RawSuggestedGroup = {
  title: string;
  rationale: string;
  sessionizeIds: string[];
};

export type SuggestedGroupSession = {
  sessionizeId: string;
  title: string;
  lengthMinutes: number | null;
  field: string | null;
};

export type SuggestedGroupWarning = {
  code: string;
  message: string;
};

export type SuggestedGroup = {
  title: string;
  rationale: string;
  sessions: SuggestedGroupSession[];
  totalMinutes: number;
  warnings: SuggestedGroupWarning[];
};

export type DuplicateSessionEntry = {
  sessionizeId: string;
  keptInGroupTitle: string;
  duplicateInGroupTitle: string;
};

export type UncoveredSession = {
  sessionizeId: string;
  title: string;
};

export type SuggestionRunReport = {
  inputSessionCount: number;
  groupedSessionCount: number;
  uncoveredSessions: UncoveredSession[];
  duplicateSessionIds: DuplicateSessionEntry[];
  invalidSessionIds: string[];
};
