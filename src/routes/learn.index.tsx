import { useState, useCallback, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import OpeningList from '#/components/OpeningList'
import { openings } from '#/data/openings'
import {
  loadProgress,
  initOpeningProgress,
  saveProgress,
  type LearningProgress,
} from '#/lib/learning-progress'

export const Route = createFileRoute('/learn/')({
  component: LearnIndex,
})

function LearnIndex() {
  const [progress, setProgress] = useState<LearningProgress>(() => loadProgress())
  const navigate = useNavigate()

  // Sync progress from localStorage on mount
  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  const handleStartOpening = useCallback(
    (openingId: string, color: 'white' | 'black') => {
      let updated = progress
      if (!updated.openings[openingId]) {
        updated = initOpeningProgress(updated, openingId, color)
      } else {
        // Update color if changed
        updated = {
          ...updated,
          openings: {
            ...updated.openings,
            [openingId]: {
              ...updated.openings[openingId],
              color,
            },
          },
        }
      }
      saveProgress(updated)
      setProgress(updated)
      navigate({ to: '/learn/$openingId', params: { openingId } })
    },
    [progress, navigate],
  )

  return (
    <main className="page-wrap px-4 pb-8 pt-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Learn Openings</h1>
          <p className="text-sm text-muted-foreground">
            Master chess openings through guided play and drills.
          </p>
        </div>
        <OpeningList
          openings={openings}
          progress={progress}
          onStartOpening={handleStartOpening}
        />
      </div>
    </main>
  )
}
