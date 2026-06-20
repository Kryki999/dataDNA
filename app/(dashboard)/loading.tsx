import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
