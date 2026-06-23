import { endOfWeek, startOfWeek, subWeeks, addWeeks } from "date-fns";
import { getPlannerData } from "@/lib/actions/calendar";
import { PlannerView } from "@/components/planner/PlannerView";

export default async function KalendarzPage() {
  const now = new Date();
  const from = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1);
  const to = addWeeks(endOfWeek(now, { weekStartsOn: 1 }), 2);

  const { scheduled, backlog, leads } = await getPlannerData(from, to);

  return (
    <PlannerView scheduled={scheduled} backlog={backlog} leads={leads} />
  );
}
