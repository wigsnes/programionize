import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
  nav?: React.ReactNode;
  actions?: React.ReactNode;
  health?: React.ReactNode;
  className?: string;
};

export function AppShell({
  title,
  children,
  nav,
  actions,
  health,
  className,
}: AppShellProps) {
  return (
    <div className={cn("flex h-svh min-h-0 flex-col overflow-hidden bg-background", className)}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="shrink-0 text-base font-semibold tracking-tight">
            {title}
          </h1>
          {nav ? (
            <>
              <AppHeaderSeparator />
              <nav className="flex items-center gap-0.5">{nav}</nav>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {health}
          {health && actions ? <AppHeaderSeparator /> : null}
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
  active?: boolean;
};

export function AppNavLink({ href, children, active = false }: AppNavLinkProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        active ? "text-foreground" : "text-muted-foreground",
      )}
      asChild
    >
      <a href={href} aria-current={active ? "page" : undefined}>
        {children}
      </a>
    </Button>
  );
}

export function AppHeaderSeparator() {
  return <Separator orientation="vertical" className="mx-1 h-5" />;
}
