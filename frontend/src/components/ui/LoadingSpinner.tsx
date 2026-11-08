export function LoadingSpinner({ size = "md", label }: { size?: "sm"|"md"|"lg"; label?: string }) {
  const sz = { sm:"w-5 h-5", md:"w-8 h-8", lg:"w-12 h-12" }[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sz} border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin`}/>
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600 animate-pulse">
      <div className="w-8 h-8 bg-navy-700 rounded-lg mb-4"/>
      <div className="w-24 h-7 bg-navy-700 rounded mb-2"/>
      <div className="w-32 h-4 bg-navy-700 rounded"/>
    </div>
  );
}
