import { useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { SessionAiDrawer, type SessionAiRow } from "./SessionAiDrawer";

type SessionAiTableProps = {
  rows: SessionAiRow[];
  groupTitleBySessionId?: Map<string, string>;
};

export function SessionAiTable({
  rows,
  groupTitleBySessionId,
}: SessionAiTableProps) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<SessionAiRow | null>(null);

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.title, row.field ?? "", row.aiDiscipline, row.stage, row.blockTitle ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [rows, filter]);

  return (
    <>
      <div className="mb-3">
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter sessions…"
          aria-label="Filter session AI table"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>AI discipline</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Block</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={row.sessionizeId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelected(row)}
              >
                <TableCell className="max-w-[200px] truncate">{row.title}</TableCell>
                <TableCell>{row.field ?? "—"}</TableCell>
                <TableCell>{row.aiDiscipline}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.stage}</Badge>
                </TableCell>
                <TableCell className="max-w-[140px] truncate">
                  {row.blockTitle ?? groupTitleBySessionId?.get(row.sessionizeId) ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <SessionAiDrawer row={selected} onClose={() => setSelected(null)} />
    </>
  );
}

export type { SessionAiRow };
