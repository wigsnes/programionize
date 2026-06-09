export type SessionStatus = "active" | "removed";

export type ImportedSession = {
  sessionizeId: string;
  title: string;
  description: string | null;
  field: string | null;
  lengthMinutes: number | null;
  isServiceSession: boolean;
  speakerNames: string[];
  /** Sessionize workflow status, e.g. Accept_Queue, Accepted, Nominated. */
  sessionizeStatus: string;
  status: SessionStatus;
};

export type ExistingSession = {
  sessionizeId: string;
  status: SessionStatus;
};

export type ImportDiffResult = {
  upserts: ImportedSession[];
  markRemovedIds: string[];
};
