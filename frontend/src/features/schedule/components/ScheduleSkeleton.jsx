function ScheduleSkeleton() {
  const days = Array.from({ length: 7 })
  const rows = Array.from({ length: 3 })

  return (
    <div className="mt-6 md:overflow-x-auto md:pb-2">
      <div className="flex animate-pulse flex-col gap-3 md:min-w-max md:flex-row">
        {days.map((_, dayIndex) => (
          <div key={dayIndex} className="panel w-full shrink-0 md:w-80">
            <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
              <div className="h-4 w-20 rounded bg-surface-2" />
              <div className="h-3 w-10 rounded bg-surface-2" />
            </div>

            <div className="divide-y divide-border">
              {rows.map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex items-baseline justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 rounded bg-surface-2" />
                    <div className="h-3 w-16 rounded bg-surface-2" />
                  </div>
                  <div className="h-3 w-24 shrink-0 rounded bg-surface-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScheduleSkeleton