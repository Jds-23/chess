import type { AnalysisResult } from './analysis-types'

const STORAGE_KEY = 'chess-analysis-recent'
const MAX_RECENT = 10

export interface RecentPosition {
  fen: string
  eval: number
  bestMove: string
  depth: number
  mate: number | null
  timestamp: number
}

function toRecent(result: AnalysisResult): RecentPosition {
  return {
    fen: result.fen,
    eval: result.eval,
    bestMove: result.bestMove,
    depth: result.depth,
    mate: result.mate,
    timestamp: Date.now(),
  }
}

export function getRecentPositions(): RecentPosition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentPosition[]
  } catch {
    return []
  }
}

export function saveRecentPosition(result: AnalysisResult): void {
  try {
    const recent = getRecentPositions()
    // Remove duplicate FEN if exists
    const filtered = recent.filter(r => r.fen !== result.fen)
    filtered.unshift(toRecent(result))
    // Keep only MAX_RECENT
    const trimmed = filtered.slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch { /* localStorage full or unavailable */ }
}

export function clearRecentPositions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}
