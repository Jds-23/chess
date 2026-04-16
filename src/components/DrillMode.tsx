import { useState, useCallback, useMemo } from 'react'
import LearningBoard from './LearningBoard'
import { Button } from '#/components/ui/button'
import type { Variation } from '#/data/openings/types'
import type { OpeningProgress } from '#/lib/learning-progress'
import { pickDrillVariation } from '#/lib/learning-progress'

interface DrillModeProps {
  variations: Variation[]
  openingProgress: OpeningProgress
  playerColor: 'white' | 'black'
  onDrillResult: (variationId: string, success: boolean) => void
  onComplete: () => void
}

export default function DrillMode({
  variations,
  openingProgress,
  playerColor,
  onDrillResult,
  onComplete,
}: DrillModeProps) {
  const taughtIds = useMemo(
    () =>
      variations
        .filter(v => {
          const p = openingProgress.variations[v.id]
          return p?.taught && !p.learned
        })
        .map(v => v.id),
    [variations, openingProgress],
  )

  const [currentVariationId, setCurrentVariationId] = useState<string | null>(
    () => pickDrillVariation(openingProgress, taughtIds),
  )
  const [moveIndex, setMoveIndex] = useState(0)
  const [hadMistake, setHadMistake] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [drillStatus, setDrillStatus] = useState<'playing' | 'success' | 'fail'>('playing')
  const [drillsCompleted, setDrillsCompleted] = useState(0)

  const currentVariation = variations.find(v => v.id === currentVariationId)
  const allMovesSan = currentVariation?.moves.map(m => m.san) ?? []

  const handleCorrectMove = useCallback(() => {
    const nextIndex = moveIndex + 1
    setMoveIndex(nextIndex)

    if (currentVariation && nextIndex >= currentVariation.moves.length) {
      if (!hadMistake) {
        setDrillStatus('success')
        onDrillResult(currentVariation.id, true)
      } else {
        setDrillStatus('fail')
        onDrillResult(currentVariation.id, false)
      }
      setDrillsCompleted(c => c + 1)
    }
  }, [moveIndex, currentVariation, hadMistake, onDrillResult])

  const handleWrongMove = useCallback(() => {
    setHadMistake(true)
  }, [])

  const nextDrill = useCallback(() => {
    // Recalculate available unlearned variations
    const remaining = variations
      .filter(v => {
        const p = openingProgress.variations[v.id]
        return p?.taught && !p.learned
      })
      .map(v => v.id)

    if (remaining.length === 0) {
      onComplete()
      return
    }

    const next = pickDrillVariation(openingProgress, remaining)
    if (!next) {
      onComplete()
      return
    }

    setCurrentVariationId(next)
    setMoveIndex(0)
    setHadMistake(false)
    setDrillStatus('playing')
    setResetKey(k => k + 1)
  }, [variations, openingProgress, onComplete])

  if (!currentVariation) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-muted-foreground">All variations mastered!</p>
        <Button onClick={onComplete}>Continue</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          Drill
        </span>
        <span className="text-xs text-muted-foreground">
          Drills completed: {drillsCompleted} | Remaining: {taughtIds.length}
        </span>
      </div>

      <LearningBoard
        playerColor={playerColor}
        moves={allMovesSan}
        moveIndex={moveIndex}
        onCorrectMove={handleCorrectMove}
        onWrongMove={handleWrongMove}
        interactive={drillStatus === 'playing'}
        resetKey={resetKey}
      />

      {/* Drill feedback */}
      <div className="rounded-lg border border-border bg-card p-3">
        {drillStatus === 'playing' && (
          <p className="text-sm text-muted-foreground">
            {hadMistake
              ? 'Wrong move — try again. No hints in drill mode.'
              : 'Play the correct moves from memory. Which variation is this?'}
          </p>
        )}
        {drillStatus === 'success' && (
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Perfect! {currentVariation.name} mastered.
          </p>
        )}
        {drillStatus === 'fail' && (
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Completed with mistakes. {currentVariation.name} needs more practice.
          </p>
        )}
      </div>

      {drillStatus !== 'playing' && (
        <Button onClick={nextDrill} size="lg" className="w-full">
          Next Drill
        </Button>
      )}
    </div>
  )
}
