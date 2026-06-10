import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  fieldStripeColor,
  lengthBarColor,
  sessionHeightPx,
} from "../lib/field-colors";
import { plainSessionDescription } from "../lib/session-description";
import { sessionLanguageLabel } from "../lib/session-language";
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
  const durationColor = lengthBarColor(session.lengthMinutes);
  const plainDescription = plainSessionDescription(session.description);
  const languageLabel = sessionLanguageLabel(session.language);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-colors",
        variant === "compact" ? "min-h-16 shadow-sm hover:shadow" : "shadow-sm",
        isRemoved && "border-dashed opacity-60",
        isHidden && "opacity-70",
        isService && "opacity-80",
      )}
      style={{
        borderLeftWidth: variant === "timeline" ? "3px" : undefined,
        borderLeftColor: variant === "timeline" ? stripeColor : undefined,
        minHeight:
          variant === "timeline"
            ? sessionHeightPx(session.lengthMinutes)
            : undefined,
      }}
    >
      {variant === "compact" ? (
        <div
          className="absolute top-0 bottom-0 left-0 w-1 rounded-l-lg"
          style={{ backgroundColor: durationColor }}
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "flex h-full flex-col py-2.5",
          variant === "compact" ? "pl-3.5 pr-3" : "px-3",
        )}
      >
        <header className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[0.6rem] font-medium tracking-wide uppercase"
          >
            {session.field ?? "No field"}
          </Badge>
          {languageLabel ? (
            <Badge variant="outline" className="text-[0.6rem]">
              {languageLabel}
            </Badge>
          ) : null}
          <span className="ml-auto text-xs font-medium text-foreground/60 tabular-nums">
            {session.lengthMinutes ? `${session.lengthMinutes} min` : "?"}
          </span>
          {isService ? (
            <Badge variant="outline" className="text-[0.6rem]">
              Service
            </Badge>
          ) : null}
          {isRemoved ? (
            <Badge
              variant="outline"
              className="border-amber-400/50 text-[0.6rem] text-amber-700"
            >
              Removed
            </Badge>
          ) : null}
          {isHidden ? (
            <Badge variant="destructive" className="text-[0.6rem]">
              Hidden
            </Badge>
          ) : null}
        </header>
        <h3 className="mt-1.5 line-clamp-2 text-sm leading-snug font-medium text-foreground">
          {session.title}
        </h3>
        {session.speakerNames.length > 0 && (
          <p className="mt-0.5 line-clamp-1 text-xs text-foreground/55">
            {session.speakerNames.join(", ")}
          </p>
        )}
        {plainDescription ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <p className="mt-1 line-clamp-2 text-xs text-foreground/55">
                {plainDescription}
              </p>
            </HoverCardTrigger>
            <HoverCardContent
              side="right"
              align="start"
              className="max-h-64 w-80 overflow-y-auto"
            >
              <p className="text-sm leading-relaxed">{plainDescription}</p>
            </HoverCardContent>
          </HoverCard>
        ) : null}
      </div>
    </article>
  );
}
