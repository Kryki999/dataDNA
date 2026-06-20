import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import type { ActivityLogEntry } from "@/lib/actions/profile";
import { SECTION_LABEL } from "@/lib/ui-patterns";

type ProfileActivityLogProps = {
  entries: ActivityLogEntry[];
};

export function ProfileActivityLog({ entries }: ProfileActivityLogProps) {
  return (
    <section className="space-y-3">
      <p className={SECTION_LABEL}>Ostatnie działania</p>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak aktywności.</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <span>
                {entry.label}
                {entry.leadName ? ` — ${entry.leadName}` : ""}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(entry.occurredAt, {
                  addSuffix: true,
                  locale: pl,
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
