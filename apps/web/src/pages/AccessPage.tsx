import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAccess } from "../access/AccessContext";

export function AccessPage() {
  const { redeemToken } = useAccess();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setError("Missing token in link.");
      setLoading(false);
      return;
    }

    redeemToken(token)
      .then(() => {
        window.history.replaceState({}, "", "/");
        window.location.reload();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not redeem link");
        setLoading(false);
      });
  }, [redeemToken]);

  if (loading) {
    return (
      <main className="relative flex min-h-svh items-center justify-center p-6">
        <ThemeToggle className="absolute top-4 right-4" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <ThemeToggle className="absolute top-4 right-4" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
