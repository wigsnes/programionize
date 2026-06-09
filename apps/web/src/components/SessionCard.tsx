import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fieldStripeColor, sessionHeightPx } from "../lib/field-colors";
import { isHiddenFromCatalog, type CatalogSession } from "../lib/sessions";

export type SessionCardProps = {
  session: CatalogSession;
  variant?: "compact" | "timeline";
};

export function SessionCard({ session, variant = "compact" }: SessionCardProps) {
  const isRemoved = session.status === "removed";
  const isHidden = !isRemoved && isHiddenFromCatalog(session);
  const isService = session.isServiceSession;
  const stripeColor = fieldStripeColor(session.field);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-md border border-border/60 bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md",
        variant === "compact" ? "min-h-16" : "",
        isRemoved && "border-dashed opacity-60",
        isHidden && "opacity-70",
        isService && "opacity-80",
      )}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: stripeColor,
        minHeight:
          variant === "timeline"
            ? sessionHeightPx(session.lengthMinutes)
            : undefined,
      }}
    >
      <div className="flex h-full flex-col px-3 py-2">
        <header className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[0.6rem] font-semibold tracking-wide uppercase"
          >
            {session.field ?? "No field"}
          </Badge>
          <span className="ml-auto text-[0.65rem] font-medium text-muted-foreground tabular-nums">
            {session.lengthMinutes ? `${session.lengthMinutes} min` : "?"}
          </span>
          {isService ? (
            <Badge variant="outline" className="text-[0.6rem]">
              Service
            </Badge>
          ) : null}
          {isRemoved ? (
            <Badge variant="outline" className="border-amber-500/50 text-[0.6rem] text-amber-700 dark:text-amber-400">
              Removed
            </Badge>
          ) : null}
          {isHidden ? (
            <Badge variant="destructive" className="text-[0.6rem]">
              Hidden
            </Badge>
          ) : null}
        </header>
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-medium">
          {session.title}
        </h3>
        {session.speakerNames.length > 0 && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {session.speakerNames.join(", ")}
          </p>
        )}
      </div>
    </article>
  );
}
