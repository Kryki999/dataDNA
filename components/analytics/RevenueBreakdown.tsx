import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { SECTION_LABEL } from "@/lib/ui-patterns";
import { FLAT_CONTAINER } from "@/lib/ui-patterns";

type RevenueBreakdownProps = {
  deals: Array<{
    dealId: string;
    amountPln: number;
    description: string | null;
    closedAt: Date;
    company: string | null;
    leadName: string | null;
  }>;
};

export function RevenueBreakdown({ deals }: RevenueBreakdownProps) {
  return (
    <section className="space-y-3">
      <p className={SECTION_LABEL}>Wygrane deale</p>
      {deals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Brak zamkniętych deali — oznacz klienta jako Wygrany w CRM.
        </p>
      ) : (
        <ul className={`divide-y divide-zinc-800 ${FLAT_CONTAINER}`}>
          {deals.map((deal) => (
            <li
              key={deal.dealId}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {deal.company ?? deal.leadName ?? deal.description ?? "Deal"}
                </p>
                {deal.description ? (
                  <p className="text-xs text-muted-foreground">
                    {deal.description}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums text-primary">
                  {deal.amountPln.toLocaleString("pl-PL")} PLN
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(deal.closedAt, "d MMM yyyy", { locale: pl })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
