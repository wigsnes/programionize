export type SuggestionInputSession = {
  sessionizeId: string;
  title: string;
  description: string | null;
  lengthMinutes: number | null;
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
};

export type SuggestedGroup = {
  title: string;
  rationale: string;
  sessions: SuggestedGroupSession[];
  totalMinutes: number;
};
