import { Chess } from 'chess.js'
import type { ParsedMove, MoveClassification } from './chesscom-types'

/**
 * Parse PGN into array of moves with FEN at each position.
 */
export function parsePgn(pgn: string): ParsedMove[] {
  const game = new Chess()
  game.loadPgn(pgn)

  const moves = game.history({ verbose: true })
  const parsed: ParsedMove[] = []

  // Replay from start to capture FEN before/after each move
  const replay = new Chess()
  for (let i = 0; i < moves.length; i++) {
    const fenBefore = replay.fen()
    const move = moves[i]
    replay.move(move.san)
    const fenAfter = replay.fen()

    parsed.push({
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion ?? ''}`,
      fenBefore,
      fenAfter,
      moveNumber: Math.floor(i / 2) + 1,
      color: move.color,
    })
  }

  return parsed
}

/**
 * Classify a move based on centipawn loss.
 * evalBefore/evalAfter in centipawns from white's perspective.
 */
export function classifyMove(
  cpLoss: number,
  isPlayerBestMove: boolean,
): MoveClassification {
  if (isPlayerBestMove) return 'best'
  if (cpLoss <= 10) return 'excellent'
  if (cpLoss <= 25) return 'good'
  if (cpLoss <= 50) return 'good'
  if (cpLoss <= 100) return 'inaccuracy'
  if (cpLoss <= 200) return 'mistake'
  return 'blunder'
}

/**
 * Calculate centipawn loss from side-to-move perspective.
 * Both evals are from white's perspective (positive = white better).
 */
export function calculateCpLoss(
  evalBefore: number,
  evalAfter: number,
  color: 'w' | 'b',
): number {
  if (color === 'w') {
    // White wants eval to stay high or go higher
    return Math.max(0, evalBefore - evalAfter)
  }
  // Black wants eval to stay low or go lower
  return Math.max(0, evalAfter - evalBefore)
}
