/** Skeleton for admin pages while their data loads. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy aria-label="Loading">
      <div className="mb-8 space-y-2 border-b pb-6">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-80 max-w-full rounded-md bg-muted" />
      </div>
      <div className="divide-y rounded-lg border bg-card">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <div className="size-8 rounded-md bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
