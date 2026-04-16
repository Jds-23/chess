import { useState, useCallback, useEffect, useMemo } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import TeachMode from '#/components/TeachMode'
import DrillMode from '#/components/DrillMode'
import { Button } from '#/components/ui/button'
import { getOpeningById } from '#/data/openings'
import {
  loadProgress,
  saveProgress,
  markVariationTaught,
  recordDrillAttempt,
  advanceVariationIndex,
  initOpeningProgress,
  type LearningProgress,
} from '#/lib/learning-progress'

export const Route = createFileRoute('/learn/$openingId')({
  component: LearnOpening,
})

type SessionPhase =
  | { type: 'teach'; variationIndex: number }
  | { type: 'drill' }
  | { type: 'complete' }

function LearnOpening() {
  const { openingId } = Route.useParams()
  const navigate = useNavigate()
  const opening = getOpeningById(openingId)

  const [progress, setProgress] = useState<LearningProgress>(() => {
    const p = loadProgress()
    if (!p.openings[openingId]) {
      const init = initOpeningProgress(p, openingId, 'white')
      saveProgress(init)
      return init
    }
    return p
  })

  const openingProgress = progress.openings[openingId]
  const playerColor = openingProgress?.color ?? 'white'

  // Determine initial phase from saved progress
  const [phase, setPhase] = useState<SessionPhase>(() => {
    if (!opening || !openingProgress) return { type: 'complete' }

    const idx = openingProgress.currentVariationIndex
    if (idx >= opening.variations.length) {
      // Check if all learned
      const allLearned = opening.variations.every(
        v => openingProgress.variations[v.id]?.learned,
      )
      if (allLearned) return { type: 'complete' }
      return { type: 'drill' }
    }

    // Check if current variation already taught
    const currentVar = opening.variations[idx]
    if (currentVar && openingProgress.variations[currentVar.id]?.taught) {
      // Check if we need to drill (every 2 taught variations) or teach next
      const taughtCount = opening.variations.filter(
        v => openingProgress.variations[v.id]?.taught,
      ).length
      const unlearnedCount = opening.variations.filter(
        v => openingProgress.variations[v.id]?.taught && !openingProgress.variations[v.id]?.learned,
      ).length

      if (unlearnedCount > 0 && taughtCount % 2 === 0) {
        return { type: 'drill' }
      }
      return { type: 'teach', variationIndex: idx }
    }

    return { type: 'teach', variationIndex: idx }
  })

  const updateProgress = useCallback((updater: (p: LearningProgress) => LearningProgress) => {
    setProgress(prev => {
      const next = updater(prev)
      saveProgress(next)
      return next
    })
  }, [])

  const handleTeachComplete = useCallback(() => {
    if (!opening) return

    const currentIdx = phase.type === 'teach' ? phase.variationIndex : 0
    const variation = opening.variations[currentIdx]
    if (!variation) return

    // Mark taught
    updateProgress(p => markVariationTaught(p, openingId, variation.id))

    const nextIdx = currentIdx + 1
    updateProgress(p => advanceVariationIndex(p, openingId, nextIdx))

    // After teaching, check if we should drill
    // Count how many are taught but not learned
    const updatedProgress = loadProgress()
    const taughtNotLearned = opening.variations.filter(v => {
      const vp = updatedProgress.openings[openingId]?.variations[v.id]
      return vp?.taught && !vp.learned
    })

    // Drill after every 2 taught variations, or if this was the last one
    if (taughtNotLearned.length >= 2 || nextIdx >= opening.variations.length) {
      if (taughtNotLearned.length > 0) {
        setProgress(updatedProgress)
        setPhase({ type: 'drill' })
        return
      }
    }

    // Otherwise teach next
    if (nextIdx < opening.variations.length) {
      setProgress(updatedProgress)
      setPhase({ type: 'teach', variationIndex: nextIdx })
    } else {
      setProgress(updatedProgress)
      setPhase({ type: 'complete' })
    }
  }, [opening, phase, openingId, updateProgress])

  const handleDrillResult = useCallback(
    (variationId: string, success: boolean) => {
      updateProgress(p => recordDrillAttempt(p, openingId, variationId, success))
    },
    [openingId, updateProgress],
  )

  const handleDrillComplete = useCallback(() => {
    if (!opening) return

    const latest = loadProgress()
    setProgress(latest)
    const op = latest.openings[openingId]
    if (!op) return

    const nextIdx = op.currentVariationIndex

    // Check if all variations are taught and learned
    const allLearned = opening.variations.every(
      v => op.variations[v.id]?.learned,
    )
    if (allLearned) {
      setPhase({ type: 'complete' })
      return
    }

    // More variations to teach
    if (nextIdx < opening.variations.length) {
      setPhase({ type: 'teach', variationIndex: nextIdx })
    } else {
      // All taught but some not learned — keep drilling
      const hasUnlearned = opening.variations.some(
        v => op.variations[v.id]?.taught && !op.variations[v.id]?.learned,
      )
      if (hasUnlearned) {
        setPhase({ type: 'drill' })
      } else {
        setPhase({ type: 'complete' })
      }
    }
  }, [opening, openingId])

  if (!opening) {
    return (
      <main className="page-wrap px-4 pb-8 pt-6">
        <p className="text-sm text-muted-foreground">Opening not found.</p>
        <Link to="/learn" className="text-sm text-primary">
          Back to openings
        </Link>
      </main>
    )
  }

  const taughtVariations = opening.variations.filter(v => {
    const vp = openingProgress?.variations[v.id]
    return vp?.taught
  })

  return (
    <main className="page-wrap px-4 pb-8 pt-6">
      <div className="mx-auto max-w-[600px]">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <Link
            to="/learn"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <h2 className="text-sm font-semibold">{opening.name}</h2>
          <span className="text-xs text-muted-foreground">
            Playing as {playerColor === 'white' ? '♔ White' : '♚ Black'}
          </span>
        </div>

        {/* Phase content */}
        {phase.type === 'teach' && opening.variations[phase.variationIndex] && (
          <TeachMode
            key={`teach-${phase.variationIndex}`}
            variation={opening.variations[phase.variationIndex]}
            playerColor={playerColor}
            onComplete={handleTeachComplete}
          />
        )}

        {phase.type === 'drill' && openingProgress && (
          <DrillMode
            key={`drill-${Date.now()}`}
            variations={opening.variations}
            openingProgress={openingProgress}
            playerColor={playerColor}
            onDrillResult={handleDrillResult}
            onComplete={handleDrillComplete}
          />
        )}

        {phase.type === 'complete' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-3xl">
              ✓
            </div>
            <h3 className="text-lg font-bold">Opening Complete!</h3>
            <p className="text-center text-sm text-muted-foreground">
              You've mastered all {opening.variations.length} variations of the{' '}
              {opening.name}.
            </p>
            <Button onClick={() => navigate({ to: '/learn' })}>
              Back to Openings
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
