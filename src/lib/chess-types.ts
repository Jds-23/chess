export type PieceColor = 'w' | 'b'
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

/** react-chessboard piece format: "wP", "bK", etc. */
export type ChessboardPiece =
  | 'wP' | 'wN' | 'wB' | 'wR' | 'wQ' | 'wK'
  | 'bP' | 'bN' | 'bB' | 'bR' | 'bQ' | 'bK'

export type Square = string

export type BoardPosition = Record<Square, ChessboardPiece>

export const PIECE_LABELS: Record<ChessboardPiece, string> = {
  wK: 'White King',
  wQ: 'White Queen',
  wR: 'White Rook',
  wB: 'White Bishop',
  wN: 'White Knight',
  wP: 'White Pawn',
  bK: 'Black King',
  bQ: 'Black Queen',
  bR: 'Black Rook',
  bB: 'Black Bishop',
  bN: 'Black Knight',
  bP: 'Black Pawn',
}

export const WHITE_PIECES: ChessboardPiece[] = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP']
export const BLACK_PIECES: ChessboardPiece[] = ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP']

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** Convert board position object to FEN piece placement string */
export function positionToFen(position: BoardPosition, sideToMove: PieceColor): string {
  const files = 'abcdefgh'
  const pieceToFenChar: Record<string, string> = {
    wP: 'P', wN: 'N', wB: 'B', wR: 'R', wQ: 'Q', wK: 'K',
    bP: 'p', bN: 'n', bB: 'b', bR: 'r', bQ: 'q', bK: 'k',
  }

  const ranks: string[] = []
  for (let rank = 8; rank >= 1; rank--) {
    let empty = 0
    let row = ''
    for (const file of files) {
      const sq = `${file}${rank}`
      const piece = position[sq]
      if (piece) {
        if (empty > 0) { row += empty; empty = 0 }
        row += pieceToFenChar[piece]
      } else {
        empty++
      }
    }
    if (empty > 0) row += empty
    ranks.push(row)
  }

  return `${ranks.join('/')} ${sideToMove} KQkq - 0 1`
}

/** Convert FEN string to board position object */
export function fenToPosition(fen: string): BoardPosition {
  const fenCharToPiece: Record<string, ChessboardPiece> = {
    P: 'wP', N: 'wN', B: 'wB', R: 'wR', Q: 'wQ', K: 'wK',
    p: 'bP', n: 'bN', b: 'bB', r: 'bR', q: 'bQ', k: 'bK',
  }
  const files = 'abcdefgh'
  const placement = fen.split(' ')[0]
  const ranks = placement.split('/')
  const position: BoardPosition = {}

  for (let r = 0; r < ranks.length; r++) {
    let fileIdx = 0
    for (const ch of ranks[r]) {
      if (ch >= '1' && ch <= '8') {
        fileIdx += Number.parseInt(ch)
      } else {
        const sq = `${files[fileIdx]}${8 - r}`
        const piece = fenCharToPiece[ch]
        if (piece) position[sq] = piece
        fileIdx++
      }
    }
  }

  return position
}

/** Extract side to move from FEN */
export function fenSideToMove(fen: string): PieceColor {
  const parts = fen.split(' ')
  return parts[1] === 'b' ? 'b' : 'w'
}

/** Validate FEN string (basic check) */
export function isValidFen(fen: string): boolean {
  const parts = fen.trim().split(/\s+/)
  if (parts.length < 2) return false
  const ranks = parts[0].split('/')
  if (ranks.length !== 8) return false
  for (const rank of ranks) {
    let count = 0
    for (const ch of rank) {
      if (ch >= '1' && ch <= '8') count += Number.parseInt(ch)
      else if ('pnbrqkPNBRQK'.includes(ch)) count++
      else return false
    }
    if (count !== 8) return false
  }
  return true
}
