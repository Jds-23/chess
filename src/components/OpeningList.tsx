import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import type { Opening } from '#/data/openings/types'
import type { LearningProgress } from '#/lib/learning-progress'
import { cn } from '#/lib/utils'

interface OpeningListProps {
  openings: Opening[]
  progress: LearningProgress
  onStartOpening: (openingId: string, color: 'white' | 'black') => void
}

export default function OpeningList({ openings, progress, onStartOpening }: OpeningListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [colorChoices, setColorChoices] = useState<Record<string, 'white' | 'black'>>({})

  return (
    <div className="flex flex-col gap-2">
      {openings.map(opening => {
        const op = progress.openings[opening.id]
        const learnedCount = opening.variations.filter(
          v => op?.variations[v.id]?.learned,
        ).length
        const totalCount = opening.variations.length
        const isComplete = learnedCount === totalCount && totalCount > 0
        const isExpanded = expandedId === opening.id
        const chosenColor = colorChoices[opening.id] ?? op?.color ?? 'white'

        return (
          <div
            key={opening.id}
            className="rounded-lg border border-border bg-card"
          >
            {/* Opening header */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : opening.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
            >
              <span className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                isComplete
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : learnedCount > 0
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-muted text-muted-foreground',
              )}>
                {isComplete ? '✓' : `${learnedCount}`}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{opening.name}</span>
                  <span className="text-xs text-muted-foreground">{opening.eco}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{opening.description}</p>
              </div>

              {/* Progress bar */}
              <div className="flex w-16 shrink-0 items-center gap-1.5">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${totalCount > 0 ? (learnedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {learnedCount}/{totalCount}
                </span>
              </div>

              <span className={cn(
                'text-xs transition-transform',
                isExpanded && 'rotate-180',
              )}>
                ▾
              </span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border px-4 pb-3 pt-2">
                {/* Variation list */}
                <ul className="mb-3 space-y-1">
                  {opening.variations.map(v => {
                    const vp = op?.variations[v.id]
                    return (
                      <li key={v.id} className="flex items-center gap-2 text-xs">
                        <span className={cn(
                          'h-4 w-4 shrink-0 rounded text-center text-[10px] leading-4 font-bold',
                          vp?.learned
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : vp?.taught
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-muted text-muted-foreground',
                        )}>
                          {vp?.learned ? '✓' : vp?.taught ? '◎' : '○'}
                        </span>
                        <span className="text-muted-foreground">{v.name}</span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {v.moves.length} moves
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* Color picker + start */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Play as:</span>
                  <button
                    type="button"
                    onClick={() => setColorChoices(c => ({ ...c, [opening.id]: 'white' }))}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded border text-sm transition-colors',
                      chosenColor === 'white'
                        ? 'border-primary bg-white text-black'
                        : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    ♔
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorChoices(c => ({ ...c, [opening.id]: 'black' }))}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded border text-sm transition-colors',
                      chosenColor === 'black'
                        ? 'border-primary bg-zinc-800 text-white'
                        : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    ♚
                  </button>

                  <Button
                    size="sm"
                    className="ml-auto"
                    onClick={() => onStartOpening(opening.id, chosenColor)}
                  >
                    {op ? 'Continue Learning' : 'Start Learning'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
