import { subMonths, addMonths } from "date-fns";
import { getCalendarEvents } from "@/lib/actions/calendar";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function KalendarzPage() {
  const now = new Date();
  const from = subMonths(now, 2);
  const to = addMonths(now, 2);

  const events = await getCalendarEvents(from, to);

  return <CalendarView events={events} />;
}
