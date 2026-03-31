import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="h-2 w-full rounded bg-muted animate-pulse" />
    </div>
  );
}

export function SkeletonMetricCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card p-6 space-y-4", className)}>
      <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      <div className="h-64 w-full rounded-xl bg-muted/50 animate-pulse" />
    </div>
  );
}

export function SkeletonClientCard() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-36 rounded bg-muted animate-pulse" />
        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
      </div>
      <div className="border-t border-border/50 pt-4 flex justify-between">
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonClientGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonClientCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="h-11 w-11 rounded-xl bg-muted animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        <div className="h-3 w-56 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
      <div className="h-8 w-24 rounded bg-muted animate-pulse" />
    </div>
  );
}

export function SkeletonContractList() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonTabsWithList() {
  return (
    <>
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </>
  );
}
