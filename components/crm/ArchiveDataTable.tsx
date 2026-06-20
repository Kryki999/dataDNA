"use client";

import { useMemo, useState, useTransition } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DealSheet } from "@/components/crm/DealSheet";
import { FLAT_CONTAINER, SECTION_LABEL } from "@/lib/ui-patterns";
import { PREDEFINED_LEAD_TAGS } from "@/lib/constants";
import {
  LEAD_SOURCE_LABELS,
  PIPELINE_STAGE_LABELS,
  type Lead,
  type PipelineStageId,
} from "@/lib/crm/pipeline";
import { reactivateLead } from "@/lib/actions/leads";
import { toast } from "sonner";

type ArchiveDataTableProps = {
  leads: Lead[];
};

export function ArchiveDataTable({ leads: initialLeads }: ArchiveDataTableProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [statusFilter, setStatusFilter] = useState<"all" | "won" | "lost">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.pipelineStage !== statusFilter) {
        return false;
      }
      if (tagFilter !== "all" && !lead.tags.includes(tagFilter)) {
        return false;
      }
      return true;
    });
  }, [leads, statusFilter, tagFilter]);

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: "company",
        header: "Firma",
        cell: ({ row }) => row.original.company ?? row.original.name,
      },
      {
        accessorKey: "pipelineStage",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.pipelineStage === "won" ? "default" : "secondary"
            }
          >
            {PIPELINE_STAGE_LABELS[row.original.pipelineStage as PipelineStageId]}
          </Badge>
        ),
      },
      {
        accessorKey: "source",
        header: "Źródło",
        cell: ({ row }) => LEAD_SOURCE_LABELS[row.original.source],
      },
      {
        accessorKey: "projectValuePln",
        header: "Wartość",
        cell: ({ row }) =>
          row.original.projectValuePln
            ? `${row.original.projectValuePln.toLocaleString("pl-PL")} PLN`
            : "—",
      },
      {
        accessorKey: "closedAt",
        header: "Zamknięto",
        cell: ({ row }) =>
          row.original.closedAt
            ? format(row.original.closedAt, "d MMM yyyy", { locale: pl })
            : "—",
      },
      {
        accessorKey: "tags",
        header: "Tagi",
        cell: ({ row }) => row.original.tags.join(", ") || "—",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              startTransition(async () => {
                try {
                  const reactivated = await reactivateLead(row.original.id, {
                    followUpInMonths: 6,
                  });
                  if (reactivated) {
                    setLeads((current) =>
                      current.filter((l) => l.id !== row.original.id),
                    );
                    toast.success("Klient reaktywowany — follow-up za 6 mies.");
                  }
                } catch {
                  toast.error("Nie udało się reaktywować");
                }
              });
            }}
          >
            Reaktywuj
          </Button>
        ),
      },
    ],
    [isPending],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DashboardPage wide>
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (v) setStatusFilter(v as typeof statusFilter);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="won">Wygrane</SelectItem>
            <SelectItem value="lost">Przegrane</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={tagFilter}
          onValueChange={(v) => {
            if (v) setTagFilter(v);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie tagi</SelectItem>
            {PREDEFINED_LEAD_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="space-y-3">
        <p className={SECTION_LABEL}>Archiwum</p>
        <div className={`overflow-x-auto ${FLAT_CONTAINER}`}>
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-zinc-800">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Brak wyników dla wybranych filtrów.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-zinc-800/60 hover:bg-zinc-900/50"
                    onClick={() => {
                      setSelectedLead(row.original);
                      setSheetOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <DealSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        lead={selectedLead}
        onUpdated={(lead) => {
          setLeads((current) =>
            current.map((l) => (l.id === lead.id ? lead : l)),
          );
        }}
        onArchived={(leadId) => {
          setLeads((current) => current.filter((l) => l.id !== leadId));
          setSheetOpen(false);
        }}
      />
    </DashboardPage>
  );
}
