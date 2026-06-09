import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AdminSessionTab } from "@/lib/admin-sessions";

type TabAccent = {
  activeUnderline: string;
  activeBadge: string;
  inactiveBadge: string;
};

const TAB_ACCENTS: Record<string, TabAccent> = {
  __all__: {
    activeUnderline: "border-b-primary",
    activeBadge: "bg-primary text-primary-foreground",
    inactiveBadge: "bg-secondary text-secondary-foreground",
  },
  Accept_Queue: {
    activeUnderline: "border-b-warning",
    activeBadge: "bg-warning text-warning-foreground",
    inactiveBadge: "bg-secondary text-secondary-foreground",
  },
  Accepted: {
    activeUnderline: "border-b-health-good",
    activeBadge: "bg-health-good text-success-foreground",
    inactiveBadge: "bg-secondary text-secondary-foreground",
  },
  Nominated: {
    activeUnderline: "border-b-primary",
    activeBadge: "bg-primary text-primary-foreground",
    inactiveBadge: "bg-secondary text-secondary-foreground",
  },
  Declined: {
    activeUnderline: "border-b-destructive",
    activeBadge: "bg-destructive text-white",
    inactiveBadge: "bg-secondary text-secondary-foreground",
  },
  Decline_Queue: {
    activeUnderline: "border-b-warning",
    activeBadge: "bg-warning text-warning-foreground",
    inactiveBadge: "bg-secondary text-secondary-foreground",
  },
  __removed__: {
    activeUnderline: "border-b-destructive",
    activeBadge: "bg-destructive text-white",
    inactiveBadge: "bg-secondary text-secondary-foreground",
  },
  __no_status__: {
    activeUnderline: "border-b-foreground",
    activeBadge: "bg-foreground text-background",
    inactiveBadge: "bg-secondary text-secondary-foreground",
  },
};

const DEFAULT_ACCENT: TabAccent = {
  activeUnderline: "border-b-primary",
  activeBadge: "bg-primary text-primary-foreground",
  inactiveBadge: "bg-secondary text-secondary-foreground",
};

function tabAccent(tabId: string): TabAccent {
  return TAB_ACCENTS[tabId] ?? DEFAULT_ACCENT;
}

type AdminSessionTabsProps = {
  tabs: AdminSessionTab[];
  value: string;
  onValueChange: (value: string) => void;
};

export function AdminSessionTabs({
  tabs,
  value,
  onValueChange,
}: AdminSessionTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <div className="-mx-1 overflow-x-auto px-1 pb-px">
        <TabsList
          variant="line"
          className="h-auto w-max min-w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0"
        >
          {tabs.map((tab) => {
            const accent = tabAccent(tab.id);
            const isActive = value === tab.id;

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "h-auto shrink-0 flex-none gap-2 rounded-none border-0 border-b-2 bg-transparent px-4 py-3 shadow-none",
                  "text-muted-foreground after:hidden hover:bg-transparent hover:text-foreground",
                  "data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
                  "dark:data-[state=active]:bg-transparent",
                  isActive
                    ? accent.activeUnderline
                    : "border-b-transparent",
                )}
              >
                <span className="text-sm font-semibold">{tab.label}</span>
                <span
                  className={cn(
                    "min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums",
                    isActive ? accent.activeBadge : accent.inactiveBadge,
                  )}
                >
                  {tab.count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </Tabs>
  );
}
