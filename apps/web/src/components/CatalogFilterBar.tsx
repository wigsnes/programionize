import type { ReactNode } from "react";
import { fieldDotColor, lengthBarColor } from "@/lib/field-colors";
import { cn } from "@/lib/utils";
import type { SelectedBlockStats } from "@/lib/sessions";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

type CatalogFilterBarProps = {
  fields: string[];
  selectedField: string | null;
  onFieldChange: (field: string | null) => void;
  lengths: number[];
  selectedLength: number | null;
  onLengthChange: (length: number | null) => void;
  fitsBlockOnly: boolean;
  onFitsBlockChange: (value: boolean) => void;
  selectedBlock: SelectedBlockStats | null;
  selectedBlockLabel: string | null;
};

function FilterPill({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.65rem] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function CatalogFilterBar({
  fields,
  selectedField,
  onFieldChange,
  lengths,
  selectedLength,
  onLengthChange,
  fitsBlockOnly,
  onFitsBlockChange,
  selectedBlock,
  selectedBlockLabel,
}: CatalogFilterBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <FilterPill
          active={selectedField === null}
          onClick={() => onFieldChange(null)}
        >
          All fields
        </FilterPill>
        {fields.map((field) => (
          <FilterPill
            key={field}
            active={selectedField === field}
            onClick={() =>
              onFieldChange(selectedField === field ? null : field)
            }
            className="inline-flex items-center gap-1"
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: fieldDotColor(field) }}
            />
            {field}
          </FilterPill>
        ))}
      </div>
      {lengths.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          <FilterPill
            active={selectedLength === null}
            onClick={() => onLengthChange(null)}
          >
            All lengths
          </FilterPill>
          {lengths.map((length) => (
            <FilterPill
              key={length}
              active={selectedLength === length}
              onClick={() =>
                onLengthChange(selectedLength === length ? null : length)
              }
              className="inline-flex items-center gap-1"
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: lengthBarColor(length) }}
              />
              {length} min
            </FilterPill>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor="fits-block-toggle"
          className={cn(
            "text-[0.65rem] leading-tight",
            !selectedBlock && "text-muted-foreground",
          )}
        >
          Only fits in{" "}
          {selectedBlockLabel ? `"${selectedBlockLabel}"` : "selected block"}
        </Label>
        <Switch
          id="fits-block-toggle"
          checked={fitsBlockOnly}
          disabled={!selectedBlock}
          onCheckedChange={onFitsBlockChange}
          aria-label="Only show sessions that fit in the selected block"
        />
      </div>
    </div>
  );
}
