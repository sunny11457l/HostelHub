export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="relative h-10 w-10">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-console-edge border-t-teal-bright" />
        <div className="absolute inset-2 rounded-full bg-teal-bright/10 animate-pulse" />
      </div>
      <p className="mono text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="console-card rounded-3xl border border-dashed border-console-edge px-8 py-14 text-center">
      <div className="mono mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-teal-bright/10 text-2xl text-teal-bright">▤</div>
      <p className="font-extrabold text-white">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger/5 px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-xl">⚠️</div>
      <p className="font-extrabold text-danger">Something went wrong</p>
      <p className="mt-1 text-sm text-slate-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-6 py-2 text-sm font-bold text-danger transition hover:bg-danger/20"
        >
          Try again
        </button>
      )}
    </div>
  );
}
