import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupPage() {
  const createMagicLink = useMutation(api.access.createMagicLink);
  const [label, setLabel] = useState("Team link");
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    try {
      const { token, path } = await createMagicLink({
        setupSecret: secret.trim(),
        label,
        expiresInDays: 30,
      });
      const url = `${window.location.origin}${path}`;
      setResult(url);
      void navigator.clipboard?.writeText(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link");
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <ThemeToggle className="absolute top-4 right-4" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create magic link</CardTitle>
          <CardDescription>
            Use the same <code className="text-xs">SETUP_SECRET</code> as in
            your{" "}
            <a
              href="https://dashboard.convex.dev/t/fredrik-wigsnes/programionize/elated-robin-592/settings/environment-variables"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Convex environment variables
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="setup-secret">Setup secret</Label>
              <Input
                id="setup-secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="link-label">Label</Label>
              <Input
                id="link-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <Button type="submit">Generate link</Button>
          </form>
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {result ? (
            <p className="mt-4 text-sm">
              Link copied to clipboard:
              <br />
              <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs">
                {result}
              </code>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
