import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function AppShell({ title, children, actions, className }: AppShellProps) {
  return (
    <div className={cn("flex h-svh min-h-0 flex-col overflow-hidden bg-background", className)}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-sm">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {actions ? (
            <>
              <AppHeaderSeparator />
              {actions}
            </>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}

type AppNavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function AppNavLink({ href, children }: AppNavLinkProps) {
  return (
    <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
      <a href={href}>{children}</a>
    </Button>
  );
}

export function AppHeaderSeparator() {
  return <Separator orientation="vertical" className="mx-1 h-5" />;
}
