import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

export type SessionAiRow = {
  sessionizeId: string;
  title: string;
  field: string | null;
  lengthMinutes: number | null;
  aiDiscipline: string;
  keywords: string[];
  embeddingText?: string;
  poolId?: string;
  stage: string;
  blockTitle?: string;
  rationale?: string;
  confidence?: number;
};

type SessionAiDrawerProps = {
  row: SessionAiRow | null;
  onClose: () => void;
};

export function SessionAiDrawer({ row, onClose }: SessionAiDrawerProps) {
  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {row ? (
          <>
            <SheetHeader>
              <SheetTitle>{row.title}</SheetTitle>
              <SheetDescription>Session AI profile and trace</SheetDescription>
            </SheetHeader>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Sessionize field</dt>
                <dd>{row.field ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Duration</dt>
                <dd>{row.lengthMinutes ?? "?"} min</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">AI discipline</dt>
                <dd>{row.aiDiscipline}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Keywords</dt>
                <dd>{row.keywords.length > 0 ? row.keywords.join(", ") : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pipeline stage</dt>
                <dd>{row.stage}</dd>
              </div>
              {row.poolId ? (
                <div>
                  <dt className="text-muted-foreground">Discipline pool</dt>
                  <dd>{row.poolId}</dd>
                </div>
              ) : null}
              {row.blockTitle ? (
                <div>
                  <dt className="text-muted-foreground">Assigned block</dt>
                  <dd>{row.blockTitle}</dd>
                </div>
              ) : null}
              {row.rationale ? (
                <div>
                  <dt className="text-muted-foreground">Rationale</dt>
                  <dd>{row.rationale}</dd>
                </div>
              ) : null}
              {row.embeddingText ? (
                <div>
                  <dt className="text-muted-foreground">Embedding text</dt>
                  <dd className="whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs">
                    {row.embeddingText}
                  </dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
