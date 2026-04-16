import { Chess } from 'chess.js'

export interface PositionAdvantage {
  type: 'tactical' | 'strategic'
  label: string
  description: string
}

export interface BoardAnnotation {
  type: 'arrow' | 'highlight'
  from?: string
  to?: string
  square?: string
  color: string
}

export interface PositionAnalysis {
  advantages: PositionAdvantage[]
  annotations: BoardAnnotation[]
}

const FILES = 'abcdefgh'
const RANKS = '12345678'

type Square = `${string}${string}`

function allSquares(): Square[] {
  const squares: Square[] = []
  for (const f of FILES) {
    for (const r of RANKS) {
      squares.push(`${f}${r}` as Square)
    }
  }
  return squares
}

/** Detect pins: a piece that cannot move without exposing a more valuable piece behind it */
function detectPins(game: Chess, perspective: 'w' | 'b'): { advantages: PositionAdvantage[]; annotations: BoardAnnotation[] } {
  const advantages: PositionAdvantage[] = []
  const annotations: BoardAnnotation[] = []
  const opponent = perspective === 'w' ? 'b' : 'w'

  // For each opponent piece, check if it's pinned (has limited mobility due to protecting a more valuable piece)
  for (const sq of allSquares()) {
    const piece = game.get(sq as Parameters<typeof game.get>[0])
    if (!piece || piece.color !== opponent) continue

    // Check if removing this piece would expose the king to attack
    // Simple heuristic: piece has very few legal moves compared to what it should have
    const fen = game.fen()
    // Switch turn to opponent to check their moves
    const testGame = new Chess(fen)
    // We can detect pins by checking if a piece's mobility is 0 or very restricted
    // This is a simplified check
    const turnChar = game.turn()
    if (turnChar === opponent) {
      const moves = testGame.moves({ square: sq as Parameters<typeof testGame.moves>[0]['square'], verbose: true })
      if (piece.type !== 'k' && piece.type !== 'p' && moves.length === 0) {
        const pieceNames: Record<string, string> = { n: 'knight', b: 'bishop', r: 'rook', q: 'queen' }
        advantages.push({
          type: 'tactical',
          label: `Pinned ${pieceNames[piece.type] ?? 'piece'}`,
          description: `Their ${pieceNames[piece.type]} on ${sq} can't move freely — it's stuck defending something important.`,
        })
        annotations.push({ type: 'highlight', square: sq, color: 'rgba(239, 68, 68, 0.4)' })
      }
    }
  }

  return { advantages, annotations }
}

/** Detect open and semi-open files */
function detectOpenFiles(game: Chess, perspective: 'w' | 'b'): { advantages: PositionAdvantage[]; annotations: BoardAnnotation[] } {
  const advantages: PositionAdvantage[] = []
  const annotations: BoardAnnotation[] = []

  for (const file of FILES) {
    let whitePawns = 0
    let blackPawns = 0
    let perspectiveRookSquare: string | null = null

    for (const rank of RANKS) {
      const sq = `${file}${rank}` as Parameters<typeof game.get>[0]
      const piece = game.get(sq)
      if (piece?.type === 'p') {
        if (piece.color === 'w') whitePawns++
        else blackPawns++
      }
      if (piece?.type === 'r' && piece.color === perspective) {
        perspectiveRookSquare = `${file}${rank}`
      }
    }

    const isOpen = whitePawns === 0 && blackPawns === 0
    const isSemiOpen = perspective === 'w' ? (whitePawns === 0 && blackPawns > 0) : (blackPawns === 0 && whitePawns > 0)

    if (perspectiveRookSquare && (isOpen || isSemiOpen)) {
      advantages.push({
        type: 'strategic',
        label: isOpen ? `Open ${file}-file` : `Semi-open ${file}-file`,
        description: isOpen
          ? `The ${file}-file has no pawns — your rook can dominate it.`
          : `Your rook controls the ${file}-file with no friendly pawns blocking it.`,
      })
      annotations.push({
        type: 'arrow',
        from: perspectiveRookSquare,
        to: `${file}${perspective === 'w' ? '8' : '1'}`,
        color: 'rgba(59, 130, 246, 0.6)',
      })
    }
  }

  return { advantages, annotations }
}

/** Detect center control (pawns on d4/e4/d5/e5) */
function detectCenterControl(game: Chess, perspective: 'w' | 'b'): { advantages: PositionAdvantage[]; annotations: BoardAnnotation[] } {
  const advantages: PositionAdvantage[] = []
  const annotations: BoardAnnotation[] = []
  const centerSquares = ['d4', 'e4', 'd5', 'e5'] as Array<Parameters<typeof game.get>[0]>

  let ownPawns = 0
  let opponentPawns = 0

  for (const sq of centerSquares) {
    const piece = game.get(sq)
    if (piece?.type === 'p') {
      if (piece.color === perspective) {
        ownPawns++
        annotations.push({ type: 'highlight', square: sq, color: 'rgba(34, 197, 94, 0.3)' })
      } else {
        opponentPawns++
      }
    }
  }

  if (ownPawns >= 2 && ownPawns > opponentPawns) {
    advantages.push({
      type: 'strategic',
      label: 'Strong center',
      description: `You've got ${ownPawns} pawns in the center — that's a powerful space advantage.`,
    })
  }

  return { advantages, annotations }
}

/** Detect development advantage */
function detectDevelopment(game: Chess, perspective: 'w' | 'b'): { advantages: PositionAdvantage[]; annotations: BoardAnnotation[] } {
  const advantages: PositionAdvantage[] = []
  const opponent = perspective === 'w' ? 'b' : 'w'

  // Count developed minor pieces (not on starting squares)
  const whiteStarting = ['b1', 'g1', 'c1', 'f1'] // knights and bishops
  const blackStarting = ['b8', 'g8', 'c8', 'f8']
  const startingSquares = perspective === 'w' ? whiteStarting : blackStarting
  const opponentStarting = perspective === 'w' ? blackStarting : whiteStarting

  let ownUndeveloped = 0
  let opponentUndeveloped = 0

  for (const sq of startingSquares) {
    const piece = game.get(sq as Parameters<typeof game.get>[0])
    if (piece && piece.color === perspective && (piece.type === 'n' || piece.type === 'b')) {
      ownUndeveloped++
    }
  }

  for (const sq of opponentStarting) {
    const piece = game.get(sq as Parameters<typeof game.get>[0])
    if (piece && piece.color === opponent && (piece.type === 'n' || piece.type === 'b')) {
      opponentUndeveloped++
    }
  }

  if (opponentUndeveloped > ownUndeveloped + 1) {
    advantages.push({
      type: 'strategic',
      label: 'Development lead',
      description: `You're ahead in development — your pieces are out while they're still getting organized.`,
    })
  }

  return { advantages, annotations }
}

/** Detect king safety (castled vs not) */
function detectKingSafety(game: Chess, perspective: 'w' | 'b'): { advantages: PositionAdvantage[]; annotations: BoardAnnotation[] } {
  const advantages: PositionAdvantage[] = []
  const opponent = perspective === 'w' ? 'b' : 'w'

  // Find kings
  let ownKingSq: string | null = null
  let opponentKingSq: string | null = null

  for (const sq of allSquares()) {
    const piece = game.get(sq as Parameters<typeof game.get>[0])
    if (piece?.type === 'k') {
      if (piece.color === perspective) ownKingSq = sq
      else opponentKingSq = sq
    }
  }

  // Check if our king is castled (on g1/c1 or g8/c8 area)
  const ownCastled = perspective === 'w'
    ? (ownKingSq === 'g1' || ownKingSq === 'h1')
    : (ownKingSq === 'g8' || ownKingSq === 'h8')

  const opponentCastled = opponent === 'w'
    ? (opponentKingSq === 'g1' || opponentKingSq === 'h1')
    : (opponentKingSq === 'g8' || opponentKingSq === 'h8')

  if (ownCastled && !opponentCastled) {
    advantages.push({
      type: 'strategic',
      label: 'King safety',
      description: `Your king is safely castled while theirs is still exposed in the center. Look for ways to keep it there.`,
    })
  }

  return { advantages, annotations }
}

/** Detect bishop pair */
function detectBishopPair(game: Chess, perspective: 'w' | 'b'): { advantages: PositionAdvantage[]; annotations: BoardAnnotation[] } {
  const advantages: PositionAdvantage[] = []
  const opponent = perspective === 'w' ? 'b' : 'w'

  let ownBishops = 0
  let opponentBishops = 0

  for (const sq of allSquares()) {
    const piece = game.get(sq as Parameters<typeof game.get>[0])
    if (piece?.type === 'b') {
      if (piece.color === perspective) ownBishops++
      else opponentBishops++
    }
  }

  if (ownBishops === 2 && opponentBishops < 2) {
    advantages.push({
      type: 'strategic',
      label: 'Bishop pair',
      description: `You have both bishops while they don't. In open positions, that's a real advantage.`,
    })
  }

  return { advantages, annotations }
}

/** Detect pressure on f7/f2 */
function detectF7Pressure(game: Chess, perspective: 'w' | 'b'): { advantages: PositionAdvantage[]; annotations: BoardAnnotation[] } {
  const advantages: PositionAdvantage[] = []
  const annotations: BoardAnnotation[] = []
  const targetSquare = perspective === 'w' ? 'f7' : 'f2'

  // Check if our pieces attack the target square
  let attackers = 0
  const attackerSquares: string[] = []

  for (const sq of allSquares()) {
    const piece = game.get(sq as Parameters<typeof game.get>[0])
    if (!piece || piece.color !== perspective) continue

    // Check if this piece attacks the target
    try {
      const testGame = new Chess(game.fen())
      // For simplicity, check if moving to the target is a legal capture
      const moves = testGame.moves({ square: sq as Parameters<typeof testGame.moves>[0]['square'], verbose: true })
      if (moves.some(m => m.to === targetSquare)) {
        attackers++
        attackerSquares.push(sq)
      }
    } catch { /* skip */ }
  }

  if (attackers >= 2) {
    advantages.push({
      type: 'tactical',
      label: `Pressure on ${targetSquare}`,
      description: `You've got ${attackers} pieces aimed at ${targetSquare} — their weakest point. Watch for tactical shots.`,
    })
    for (const sq of attackerSquares) {
      annotations.push({
        type: 'arrow',
        from: sq,
        to: targetSquare,
        color: 'rgba(239, 68, 68, 0.5)',
      })
    }
  }

  return { advantages, annotations }
}

/** Detect space advantage */
function detectSpaceAdvantage(game: Chess, perspective: 'w' | 'b'): { advantages: PositionAdvantage[]; annotations: BoardAnnotation[] } {
  const advantages: PositionAdvantage[] = []

  let ownAdvancedPawns = 0
  let opponentAdvancedPawns = 0

  for (const sq of allSquares()) {
    const piece = game.get(sq as Parameters<typeof game.get>[0])
    if (piece?.type !== 'p') continue

    const rank = parseInt(sq[1])
    if (piece.color === 'w' && rank >= 4) {
      if (perspective === 'w') ownAdvancedPawns++
      else opponentAdvancedPawns++
    }
    if (piece.color === 'b' && rank <= 5) {
      if (perspective === 'b') ownAdvancedPawns++
      else opponentAdvancedPawns++
    }
  }

  if (ownAdvancedPawns >= 3 && ownAdvancedPawns > opponentAdvancedPawns + 1) {
    advantages.push({
      type: 'strategic',
      label: 'Space advantage',
      description: `Your pawns are pushed forward, cramping their pieces. Use that space to maneuver.`,
    })
  }

  return { advantages, annotations }
}

/** Main analysis function */
export function analyzePositionAdvantages(fen: string, perspective: 'w' | 'b'): PositionAnalysis {
  try {
    const game = new Chess(fen)
    const allAdvantages: PositionAdvantage[] = []
    const allAnnotations: BoardAnnotation[] = []

    const detectors = [
      detectPins,
      detectOpenFiles,
      detectCenterControl,
      detectDevelopment,
      detectKingSafety,
      detectBishopPair,
      detectF7Pressure,
      detectSpaceAdvantage,
    ]

    for (const detect of detectors) {
      try {
        const result = detect(game, perspective)
        allAdvantages.push(...result.advantages)
        allAnnotations.push(...result.annotations)
      } catch { /* skip failing detector */ }
    }

    return {
      advantages: allAdvantages,
      annotations: allAnnotations,
    }
  } catch {
    return { advantages: [], annotations: [] }
  }
}
