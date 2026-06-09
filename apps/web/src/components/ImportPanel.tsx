import { useAction } from "convex/react";
import { useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import { useAccess } from "../access/AccessContext";
import { Button } from "./ui/button";

export function ImportPanel() {
  const { sessionToken } = useAccess();
  const importFromSessionize = useAction(api.sessions.importFromSessionize);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    setLoading(true);
    setStatus(null);
    try {
      if (!sessionToken) throw new Error("Not signed in");
      const result = await importFromSessionize({ sessionToken });
      setStatus(`Imported ${result.upserted} sessions (${result.removed} removed).`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Import failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleImport} disabled={loading}>
        {loading ? "Importing…" : "Import from Sessionize"}
      </Button>
      {status ? (
        <p className="max-w-xs text-right text-xs text-muted-foreground">
          {status}
        </p>
      ) : null}
    </div>
  );
}
