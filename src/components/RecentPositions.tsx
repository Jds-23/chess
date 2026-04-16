import { useState, useEffect } from 'react'
import { type RecentPosition, getRecentPositions, clearRecentPositions } from '#/lib/recent-positions'
import { Button } from '#/components/ui/button'

interface RecentPositionsProps {
  onLoadPosition: (fen: string) => void
}

function formatEval(cp: number, mate: number | null): string {
  if (mate != null) return mate > 0 ? `M${mate}` : `M${mate}`
  const pawns = cp / 100
  return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1)
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RecentPositions({ onLoadPosition }: RecentPositionsProps) {
  const [positions, setPositions] = useState<RecentPosition[]>([])

  useEffect(() => {
    setPositions(getRecentPositions())
  }, [])

  if (positions.length === 0) return null

  return (
    <div className="island-shell rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">Recent Analyses</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => { clearRecentPositions(); setPositions([]) }}
        >
          Clear
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        {positions.map((pos) => (
          <button
            key={pos.fen}
            type="button"
            onClick={() => onLoadPosition(pos.fen)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
          >
            <span className={`inline-flex min-w-[3rem] justify-center rounded px-1 py-0.5 font-bold ${
              pos.eval >= 0 ? 'bg-white text-zinc-800' : 'bg-zinc-800 text-white'
            }`}>
              {formatEval(pos.eval, pos.mate)}
            </span>
            <span className="flex-1 truncate font-mono text-muted-foreground">
              {pos.fen.split(' ')[0]}
            </span>
            <span className="shrink-0 text-muted-foreground/60">
              {timeAgo(pos.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
