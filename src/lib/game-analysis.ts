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

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

function materialDiff(fen: string, color: 'w' | 'b'): number {
  const placement = fen.split(' ')[0]
  let own = 0
  let opp = 0
  for (const ch of placement) {
    const lower = ch.toLowerCase()
    const v = PIECE_VALUES[lower]
    if (v === undefined) continue
    const isWhite = ch === ch.toUpperCase()
    if ((isWhite && color === 'w') || (!isWhite && color === 'b')) own += v
    else opp += v
  }
  return own - opp
}

interface ClassifyArgs {
  cpLoss: number
  isPlayerBestMove: boolean
  isBookMove: boolean
  prevMate: number | null
  playedLeadsToMate: boolean
  color: 'w' | 'b'
  fenBefore: string
  fenAfter: string
}

/**
 * Classify a move based on centipawn loss.
 * evalBefore/evalAfter in centipawns from white's perspective.
 */
export function classifyMove(args: ClassifyArgs): MoveClassification {
  const { cpLoss, isPlayerBestMove, isBookMove, prevMate, playedLeadsToMate, color, fenBefore, fenAfter } = args

  if (isBookMove) return 'book'

  const favoredWin = prevMate !== null && ((color === 'w' && prevMate > 0) || (color === 'b' && prevMate < 0))
  if (favoredWin && !playedLeadsToMate) return 'missed-win'

  if (isPlayerBestMove) {
    const before = materialDiff(fenBefore, color)
    const after = materialDiff(fenAfter, color)
    if (after <= before - 3 && after < 0) return 'brilliant'
    return 'best'
  }

  if (cpLoss <= 10) return 'excellent'
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
