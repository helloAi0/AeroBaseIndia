interface BoxProps { className?: string; style?: React.CSSProperties; }

export function Skeleton({ className = "", style }: BoxProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Full-page placeholder shown while a lazy page chunk loads. */
export function PageSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid xl:grid-cols-3 gap-5">
        <Skeleton className="h-72 xl:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-navy-600 p-4 space-y-3" role="status" aria-label="Loading table">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );
}
