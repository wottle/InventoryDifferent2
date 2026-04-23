export default function DeviceDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Back nav bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-32 bg-surface-container rounded-full" />
        <div className="h-8 w-8 bg-surface-container rounded-full" />
      </div>

      {/* Hero */}
      <div className="relative h-[500px] w-full rounded-xl bg-surface-container-high -mx-4 sm:-mx-6 lg:-mx-8 xl:mx-0 mb-8" />

      {/* Quick Overview card */}
      <div className="bg-[var(--card)] rounded-xl p-8 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="h-4 w-28 bg-surface-container rounded-full" />
          <div className="h-6 w-24 bg-surface-container rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-surface-container rounded-full" />
            <div className="h-5 w-36 bg-surface-container-high rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-surface-container rounded-full" />
            <div className="h-5 w-28 bg-surface-container-high rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-surface-container rounded-full" />
            <div className="h-5 w-32 bg-surface-container-high rounded-full" />
          </div>
        </div>
        {/* Notes lines */}
        <div className="mt-10 pt-8 border-t border-outline-variant/20 space-y-2">
          <div className="h-3 w-20 bg-surface-container rounded-full mb-4" />
          <div className="h-3 w-full bg-surface-container rounded-full" />
          <div className="h-3 w-5/6 bg-surface-container rounded-full" />
          <div className="h-3 w-4/6 bg-surface-container rounded-full" />
        </div>
      </div>

      {/* Indicator cards row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[var(--card)] rounded-xl p-4 shadow-sm flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-surface-container rounded-full" />
            <div className="h-2.5 w-12 bg-surface-container rounded-full" />
          </div>
        ))}
      </div>

      {/* Two-column content */}
      <div className="xl:grid xl:grid-cols-12 xl:gap-8">
        {/* Left column */}
        <div className="xl:col-span-8 space-y-6">
          {/* Tech Specs card */}
          <div className="bg-[var(--card)] rounded-xl p-8 shadow-sm">
            <div className="h-4 w-40 bg-surface-container rounded-full mb-6" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2.5 w-16 bg-surface-container rounded-full" />
                  <div className="h-4 w-32 bg-surface-container-high rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Photos card */}
          <div className="bg-[var(--card)] rounded-xl p-8 shadow-sm">
            <div className="h-4 w-20 bg-surface-container rounded-full mb-6" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-surface-container rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="xl:col-span-4 space-y-6 mt-6 xl:mt-0">
          {/* Photos mini card */}
          <div className="bg-[var(--card)] rounded-xl p-6 shadow-sm">
            <div className="h-4 w-16 bg-surface-container rounded-full mb-4" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-surface-container rounded-lg" />
              ))}
            </div>
          </div>
          {/* Maintenance card */}
          <div className="bg-[var(--card)] rounded-xl p-6 shadow-sm space-y-4">
            <div className="h-4 w-32 bg-surface-container rounded-full" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-36 bg-surface-container rounded-full" />
                  <div className="h-3 w-24 bg-surface-container rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
