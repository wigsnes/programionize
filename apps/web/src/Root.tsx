import "./index.css";
import { AccessProvider, useAccess } from "./access/AccessContext";
import { DialogProvider } from "./components/dialogs/DialogProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
import { App } from "./App";
import { AccessGate } from "./pages/AccessGate";
import { AccessPage } from "./pages/AccessPage";
import { SetupPage } from "./pages/SetupPage";
import { AdminSessionsPage } from "./pages/AdminSessionsPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";

function RoutedApp() {
  const path = window.location.pathname;
  const { isAuthenticated, isLoading } = useAccess();

  if (path === "/access") return <AccessPage />;
  if (path === "/setup") return <SetupPage />;
  if (isLoading) {
    return (
      <main className="relative flex min-h-svh items-center justify-center">
        <ThemeToggle className="absolute top-4 right-4" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }
  if (!isAuthenticated) return <AccessGate />;
  if (path === "/suggestions") return <SuggestionsPage />;
  if (path === "/admin") return <AdminSessionsPage />;
  return <App />;
}

export function Root() {
  return (
    <ThemeProvider>
      <DialogProvider>
        <AccessProvider>
          <RoutedApp />
        </AccessProvider>
      </DialogProvider>
    </ThemeProvider>
  );
}
