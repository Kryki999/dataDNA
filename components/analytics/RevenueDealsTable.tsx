"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
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
import { ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealSheet } from "@/components/crm/DealSheet";
import { FLAT_CONTAINER } from "@/lib/ui-patterns";
import { getLeadById } from "@/lib/actions/leads";
import type { Lead } from "@/lib/crm/pipeline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type RevenueDealRow = {
  dealId: string;
  amountPln: number;
  description: string | null;
  closedAt: Date;
  leadId: string | null;
  leadName: string | null;
  company: string | null;
  tags: string[] | null;
};

type RevenueDealsTableProps = {
  deals: RevenueDealRow[];
};

function getClientLabel(deal: RevenueDealRow): string {
  return deal.company ?? deal.leadName ?? deal.description ?? "Deal";
}

function getClientInitials(deal: RevenueDealRow): string {
  const label = getClientLabel(deal);
  const words = label.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

function getProjectType(deal: RevenueDealRow): string {
  if (deal.tags && deal.tags.length > 0) {
    return deal.tags[0]!;
  }
  return deal.description ?? "—";
}

export function RevenueDealsTable({ deals }: RevenueDealsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "closedAt", desc: true },
  ]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalRevenue = useMemo(
    () => deals.reduce((sum, deal) => sum + deal.amountPln, 0),
    [deals],
  );

  const openDealSheet = useCallback(
    (deal: RevenueDealRow) => {
      if (!deal.leadId) {
        toast.error("Brak powiązanego klienta w CRM");
        return;
      }

      startTransition(async () => {
        try {
          const lead = await getLeadById(deal.leadId!);
          if (!lead) {
            toast.error("Nie znaleziono klienta");
            return;
          }
          setSelectedLead(lead);
          setSheetOpen(true);
        } catch {
          toast.error("Nie udało się otworzyć szczegółów");
        }
      });
    },
    [],
  );

  const columns = useMemo<ColumnDef<RevenueDealRow>[]>(
    () => [
      {
        accessorKey: "company",
        header: "Klient",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-7 border border-zinc-800 bg-zinc-900">
              <AvatarFallback className="bg-zinc-900 text-[10px] font-medium text-zinc-400">
                {getClientInitials(row.original)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-zinc-100">
                {getClientLabel(row.original)}
              </p>
              {row.original.company && row.original.leadName ? (
                <p className="text-xs text-zinc-500">
                  {row.original.leadName}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "projectType",
        header: "Typ projektu",
        cell: ({ row }) => {
          const type = getProjectType(row.original);
          if (type === "—") return <span className="text-zinc-600">—</span>;
          return (
            <Badge
              variant="outline"
              className="border-zinc-700 bg-zinc-900/50 text-[11px] font-normal text-zinc-300"
            >
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "amountPln",
        header: "Wartość",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold tabular-nums text-primary">
            {row.original.amountPln.toLocaleString("pl-PL")} PLN
          </span>
        ),
      },
      {
        accessorKey: "closedAt",
        header: "Data wdrożenia",
        cell: ({ row }) => (
          <span className="text-sm text-zinc-400">
            {format(row.original.closedAt, "d MMM yyyy", { locale: pl })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-zinc-500 hover:text-zinc-200"
            disabled={!row.original.leadId || isPending}
            onClick={(e) => {
              e.stopPropagation();
              openDealSheet(row.original);
            }}
          >
            <ArrowUpRight className="size-3.5" />
          </Button>
        ),
      },
    ],
    [isPending, openDealSheet],
  );

  const table = useReactTable({
    data: deals,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Wygrane deale
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {deals.length}{" "}
              {deals.length === 1 ? "deal" : "deale"}
              {deals.length > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-medium tabular-nums text-emerald-400">
                    +{totalRevenue.toLocaleString("pl-PL")} PLN
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className={cn("overflow-x-auto", FLAT_CONTAINER)}>
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-zinc-800">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
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
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    Brak zamkniętych deali — oznacz klienta jako Wygrany w CRM.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-zinc-800/60 transition-colors",
                      row.original.leadId
                        ? "cursor-pointer hover:bg-zinc-900/50"
                        : "opacity-80",
                      isPending && "pointer-events-none opacity-60",
                    )}
                    onClick={() => openDealSheet(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5">
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
        onUpdated={(lead) => setSelectedLead(lead)}
        onArchived={() => {
          setSheetOpen(false);
          setSelectedLead(null);
        }}
      />
    </>
  );
}
