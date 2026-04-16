import { createServerFn } from '@tanstack/react-start'

export const analyzePositionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { fen: string; depth?: number; multiPv?: number }) => {
    // Basic FEN validation
    const parts = data.fen?.trim().split(/\s+/)
    if (!parts || parts.length < 2) throw new Error('Invalid FEN')
    const ranks = parts[0].split('/')
    if (ranks.length !== 8) throw new Error('Invalid FEN')

    const depth = Math.min(Math.max(data.depth ?? 18, 1), 24)
    const multiPv = Math.min(Math.max(data.multiPv ?? 3, 1), 5)
    return { fen: data.fen, depth, multiPv }
  })
  .handler(async ({ data }) => {
    // Dynamic import to keep stockfish server-only
    const { analyzePosition } = await import('./stockfish-engine.server')
    return analyzePosition(data.fen, data.depth, data.multiPv)
  })
