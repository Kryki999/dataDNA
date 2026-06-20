import { subMonths, addMonths } from "date-fns";
import { getCalendarEvents, getUpcomingEvents } from "@/lib/actions/calendar";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function KalendarzPage() {
  const now = new Date();
  const from = subMonths(now, 2);
  const to = addMonths(now, 2);

  const [events, upcoming] = await Promise.all([
    getCalendarEvents(from, to),
    getUpcomingEvents(20),
  ]);

  return <CalendarView events={events} upcoming={upcoming} />;
}
