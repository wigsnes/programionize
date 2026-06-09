import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AccessGate() {
  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <ThemeToggle className="absolute top-4 right-4" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Programionize</CardTitle>
          <CardDescription>
            Open the magic link from your organizer to access the program
            builder.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </main>
  );
}
