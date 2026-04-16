import { useState, useCallback } from 'react'
import LearningBoard from './LearningBoard'
import { Button } from '#/components/ui/button'
import type { Variation } from '#/data/openings/types'

interface TeachModeProps {
  variation: Variation
  playerColor: 'white' | 'black'
  onComplete: () => void
}

export default function TeachMode({ variation, playerColor, onComplete }: TeachModeProps) {
  const [moveIndex, setMoveIndex] = useState(0)
  const [commentary, setCommentary] = useState<string>(
    variation.moves[0]?.commentary ?? '',
  )
  const [wrongMoveMsg, setWrongMoveMsg] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  const allMovesSan = variation.moves.map(m => m.san)

  const handleCorrectMove = useCallback(() => {
    const nextIndex = moveIndex + 1
    setMoveIndex(nextIndex)
    setWrongMoveMsg(null)

    if (nextIndex >= variation.moves.length) {
      setFinished(true)
      setCommentary('Variation complete!')
    } else {
      setCommentary(variation.moves[nextIndex].commentary)
    }
  }, [moveIndex, variation.moves])

  const handleWrongMove = useCallback(() => {
    const expected = variation.moves[moveIndex]
    setWrongMoveMsg(`Try again. The correct move is ${expected.san}.`)
  }, [moveIndex, variation.moves])

  // Show first move commentary at start for the player's first move
  const playerMovesFirst = playerColor === 'white'
  const showInitialHint =
    moveIndex === 0 && !finished && playerMovesFirst

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
          Learn
        </span>
        <h3 className="text-sm font-semibold">{variation.name}</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          Move {Math.min(moveIndex + 1, variation.moves.length)}/{variation.moves.length}
        </span>
      </div>

      <LearningBoard
        playerColor={playerColor}
        moves={allMovesSan}
        moveIndex={moveIndex}
        onCorrectMove={handleCorrectMove}
        onWrongMove={handleWrongMove}
        interactive={!finished}
      />

      {/* Commentary panel */}
      <div className="rounded-lg border border-border bg-card p-3">
        {wrongMoveMsg ? (
          <p className="text-sm font-medium text-destructive">{wrongMoveMsg}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {showInitialHint && (
              <span className="font-medium text-foreground">
                Play {variation.moves[0].san}.{' '}
              </span>
            )}
            {commentary}
          </p>
        )}
      </div>

      {finished && (
        <Button onClick={onComplete} size="lg" className="w-full">
          Continue
        </Button>
      )}
    </div>
  )
}
