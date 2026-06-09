import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus } from "lucide-react";

export type ProgramPageItem = {
  _id: string;
  name: string;
};

type PageNavProps = {
  pages: ProgramPageItem[];
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
  onCreate: () => void;
  onRename: (pageId: string) => void;
  onDelete: (pageId: string) => void;
};

export function PageNav({
  pages,
  selectedPageId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: PageNavProps) {
  const canDelete = pages.length > 1;

  return (
    <nav
      className="flex w-[200px] shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground"
      aria-label="Program pages"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-[0.65rem] font-semibold tracking-wider text-sidebar-foreground/60 uppercase">
          Pages
        </h2>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={onCreate}
          aria-label="New page"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col gap-0.5 pr-2">
          {pages.map((page) => {
            const isSelected = page._id === selectedPageId;
            return (
              <li key={page._id} className="group relative">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className={cn(
                      "min-w-0 flex-1 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                    aria-current={isSelected ? "page" : undefined}
                    onClick={() => onSelect(page._id)}
                  >
                    <span
                      className={cn(
                        "block truncate",
                        isSelected &&
                          "border-l-2 border-primary pl-2 -ml-0.5",
                      )}
                    >
                      {page.name}
                    </span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className={cn(
                          "shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100",
                        )}
                        aria-label={`Actions for ${page.name}`}
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => onRename(page._id)}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={!canDelete}
                        onClick={() => onDelete(page._id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
      {pages.length === 0 ? (
        <p className="px-1 text-xs text-sidebar-foreground/60">
          Create a page to start scheduling.
        </p>
      ) : null}
    </nav>
  );
}
