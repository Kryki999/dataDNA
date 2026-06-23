"use client";

import { useMemo, useState } from "react";
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
import { FLAT_CONTAINER } from "@/lib/ui-patterns";
import { getTagColorClass } from "@/lib/crm/tags";
import {
  LEAD_SOURCE_LABELS,
  PIPELINE_STAGE_LABELS,
  type Lead,
  type LeadWithMeta,
  type PipelineStageId,
} from "@/lib/crm/pipeline";
import { cn } from "@/lib/utils";

type LeadsListTableProps = {
  leads: LeadWithMeta[];
  onOpenLead: (lead: Lead) => void;
};

export function LeadsListTable({ leads, onOpenLead }: LeadsListTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);

  const columns = useMemo<ColumnDef<LeadWithMeta>[]>(
    () => [
      {
        accessorKey: "company",
        header: "Firma",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {row.original.company ?? row.original.name}
            </p>
            {row.original.company ? (
              <p className="text-xs text-muted-foreground">
                {row.original.name}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "pipelineStage",
        header: "Etap",
        cell: ({ row }) => (
          <span className="text-sm">
            {
              PIPELINE_STAGE_LABELS[
                row.original.pipelineStage as PipelineStageId
              ]
            }
          </span>
        ),
      },
      {
        accessorKey: "projectValuePln",
        header: "Wartość",
        cell: ({ row }) =>
          row.original.projectValuePln ? (
            <span className="font-mono text-sm tabular-nums text-primary">
              {row.original.projectValuePln.toLocaleString("pl-PL")} PLN
            </span>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "lastContactedAt",
        header: "Ostatni kontakt",
        cell: ({ row }) =>
          row.original.lastContactedAt
            ? format(row.original.lastContactedAt, "d MMM yyyy", { locale: pl })
            : "—",
      },
      {
        accessorKey: "nextFollowUpAt",
        header: "Następny kontakt",
        cell: ({ row }) =>
          row.original.nextFollowUpAt
            ? format(row.original.nextFollowUpAt, "d MMM yyyy, HH:mm", {
                locale: pl,
              })
            : "—",
      },
      {
        accessorKey: "source",
        header: "Źródło",
        cell: ({ row }) => LEAD_SOURCE_LABELS[row.original.source],
      },
      {
        accessorKey: "tags",
        header: "Tagi",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.length === 0 ? (
              "—"
            ) : (
              row.original.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                    getTagColorClass(tag),
                  )}
                >
                  {tag}
                </span>
              ))
            )}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Aktualizacja",
        cell: ({ row }) =>
          format(row.original.updatedAt, "d MMM yyyy", { locale: pl }),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={`overflow-x-auto ${FLAT_CONTAINER}`}>
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-dna-border/40">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-muted-foreground select-none hover:text-foreground"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {{
                      asc: " ↑",
                      desc: " ↓",
                    }[header.column.getIsSorted() as string] ?? null}
                  </span>
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
                className="px-4 py-12 text-center text-muted-foreground"
              >
                Brak aktywnych klientów w lejku.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-dna-border/30 transition-colors hover:bg-dna-inset/50"
                onClick={() => onOpenLead(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
