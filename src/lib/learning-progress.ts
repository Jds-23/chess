const STORAGE_KEY = 'chess-learning-progress'

export interface VariationProgress {
  taught: boolean
  drillAttempts: number
  drillSuccesses: number
  lastDrillAt: number | null
  learned: boolean
}

export interface OpeningProgress {
  color: 'white' | 'black'
  currentVariationIndex: number
  variations: Record<string, VariationProgress>
}

export interface LearningProgress {
  openings: Record<string, OpeningProgress>
}

function defaultProgress(): LearningProgress {
  return { openings: {} }
}

export function loadProgress(): LearningProgress {
  if (typeof window === 'undefined') return defaultProgress()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    return JSON.parse(raw) as LearningProgress
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: LearningProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function getOpeningProgress(
  progress: LearningProgress,
  openingId: string,
): OpeningProgress | undefined {
  return progress.openings[openingId]
}

export function initOpeningProgress(
  progress: LearningProgress,
  openingId: string,
  color: 'white' | 'black',
): LearningProgress {
  return {
    ...progress,
    openings: {
      ...progress.openings,
      [openingId]: {
        color,
        currentVariationIndex: 0,
        variations: {},
      },
    },
  }
}

export function defaultVariationProgress(): VariationProgress {
  return {
    taught: false,
    drillAttempts: 0,
    drillSuccesses: 0,
    lastDrillAt: null,
    learned: false,
  }
}

export function markVariationTaught(
  progress: LearningProgress,
  openingId: string,
  variationId: string,
): LearningProgress {
  const opening = progress.openings[openingId]
  if (!opening) return progress
  return {
    ...progress,
    openings: {
      ...progress.openings,
      [openingId]: {
        ...opening,
        variations: {
          ...opening.variations,
          [variationId]: {
            ...(opening.variations[variationId] ?? defaultVariationProgress()),
            taught: true,
          },
        },
      },
    },
  }
}

export function recordDrillAttempt(
  progress: LearningProgress,
  openingId: string,
  variationId: string,
  success: boolean,
): LearningProgress {
  const opening = progress.openings[openingId]
  if (!opening) return progress
  const prev = opening.variations[variationId] ?? defaultVariationProgress()
  return {
    ...progress,
    openings: {
      ...progress.openings,
      [openingId]: {
        ...opening,
        variations: {
          ...opening.variations,
          [variationId]: {
            ...prev,
            drillAttempts: prev.drillAttempts + 1,
            drillSuccesses: prev.drillSuccesses + (success ? 1 : 0),
            lastDrillAt: Date.now(),
            learned: success ? true : prev.learned,
          },
        },
      },
    },
  }
}

export function advanceVariationIndex(
  progress: LearningProgress,
  openingId: string,
  newIndex: number,
): LearningProgress {
  const opening = progress.openings[openingId]
  if (!opening) return progress
  return {
    ...progress,
    openings: {
      ...progress.openings,
      [openingId]: {
        ...opening,
        currentVariationIndex: newIndex,
      },
    },
  }
}

/** Pick variation for drill, weighted toward newer/less-drilled ones */
export function pickDrillVariation(
  opening: OpeningProgress,
  taughtVariationIds: string[],
): string | null {
  const unlearned = taughtVariationIds.filter(id => {
    const v = opening.variations[id]
    return v && v.taught && !v.learned
  })
  if (unlearned.length === 0) return null

  const now = Date.now()
  const weights = unlearned.map(id => {
    const v = opening.variations[id]!
    const successWeight = 1 / (v.drillSuccesses + 1)
    const recency = v.lastDrillAt ? (now - v.lastDrillAt) / (1000 * 60 * 60) : 10 // hours since last drill, default 10
    const recencyWeight = Math.min(recency, 24) / 24 // cap at 1
    return { id, weight: successWeight * (0.5 + recencyWeight) }
  })

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  let rand = Math.random() * totalWeight
  for (const w of weights) {
    rand -= w.weight
    if (rand <= 0) return w.id
  }
  return weights[weights.length - 1].id
}
