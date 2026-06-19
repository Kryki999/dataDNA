"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  LEAD_SOURCE_LABELS,
  PIPELINE_STAGE_LABELS,
  type Lead,
} from "@/lib/crm/pipeline";
import { DealSheet } from "./DealSheet";

type ClientArchiveProps = {
  leads: Lead[];
};

export function ClientArchive({ leads: initialLeads }: ClientArchiveProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Archiwum / Baza klientów</CardTitle>
          <CardDescription>
            Wygrane i przegrane deale — poza aktywnym lejkiem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Brak zamkniętych deali w archiwum.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Źródło</TableHead>
                    <TableHead className="text-right">Wartość</TableHead>
                    <TableHead className="text-right">Zamknięto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedLead(lead);
                        setSheetOpen(true);
                      }}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {lead.company || lead.name}
                          </p>
                          {lead.company ? (
                            <p className="text-xs text-muted-foreground">
                              {lead.name}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            lead.pipelineStage === "won"
                              ? "border-primary/40 text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {PIPELINE_STAGE_LABELS[lead.pipelineStage]}
                        </Badge>
                      </TableCell>
                      <TableCell>{LEAD_SOURCE_LABELS[lead.source]}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {lead.projectValuePln
                          ? `${lead.projectValuePln.toLocaleString("pl-PL")} PLN`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {lead.closedAt
                          ? format(lead.closedAt, "d MMM yyyy", { locale: pl })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DealSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        lead={selectedLead}
        onUpdated={(lead) =>
          setLeads((current) =>
            current.map((item) => (item.id === lead.id ? lead : item)),
          )
        }
        onArchived={(leadId) =>
          setLeads((current) => current.filter((item) => item.id !== leadId))
        }
      />
    </>
  );
}
