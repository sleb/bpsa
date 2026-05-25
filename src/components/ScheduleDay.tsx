import { useEffect, useState } from 'react'
import type { SanityScheduleDay, SanityEntry } from '@/lib/sanity'
import {
  getTodayCampDay,
  getCurrentTimeMinutes,
  parseTimeToMinutes,
  findActiveIndex,
  formatTime12h,
} from '@/lib/campTime'
import { cn } from '@/lib/utils'

interface Props {
  days: SanityScheduleDay[]
  currentDate: string
}

export default function ScheduleDay({ days, currentDate }: Props) {
  const [nowMinutes, setNowMinutes] = useState<number | null>(null)
  const todayDate = getTodayCampDay()

  useEffect(() => {
    const update = () => setNowMinutes(getCurrentTimeMinutes())
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  const day = days.find((d) => d.date === currentDate)!
  const entries = day.entries ?? []
  const activeIndex =
    nowMinutes !== null && currentDate === todayDate
      ? findActiveIndex(entries, nowMinutes)
      : -1

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-lg font-semibold">BP Youth Summer Adventure 2026</h1>
          <nav className="mt-2 flex gap-1 overflow-x-auto">
            {days.map((d) => (
              <a
                key={d.date}
                href={`/schedule/${d.date}`}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  d.date === currentDate
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {d.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <ul className="space-y-1">
          {entries.map((entry, i) => (
            <EntryRow key={entry._key} entry={entry} isActive={i === activeIndex} />
          ))}
        </ul>
      </main>
    </div>
  )
}

function EntryRow({ entry, isActive }: { entry: SanityEntry; isActive: boolean }) {
  return (
    <li
      className={cn(
        'flex gap-3 rounded-lg px-3 py-3 transition-colors',
        isActive ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted/50'
      )}
    >
      {isActive && (
        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      )}
      <div className={cn('min-w-0', !isActive && 'pl-5')}>
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-sm font-mono text-muted-foreground">
            {formatTime12h(entry.time)}
          </span>
          <span className="font-medium">{entry.activity}</span>
        </div>
        {entry.location && (
          <p className="mt-0.5 text-sm text-muted-foreground">{entry.location}</p>
        )}
      </div>
    </li>
  )
}
