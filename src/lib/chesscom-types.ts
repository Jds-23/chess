export interface ChessComPlayer {
  rating: number
  result: string
  username: string
  uuid: string
}

export interface ChessComGame {
  url: string
  pgn: string
  time_control: string
  time_class: 'daily' | 'rapid' | 'blitz' | 'bullet'
  end_time: number
  rated: boolean
  white: ChessComPlayer
  black: ChessComPlayer
  rules: string
  initial_setup: string
  fen: string
  accuracies?: { white: number; black: number }
}

export interface ParsedMove {
  san: string
  uci: string
  fenBefore: string
  fenAfter: string
  moveNumber: number
  color: 'w' | 'b'
}

export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed-win'

export interface MoveAnalysis {
  move: ParsedMove
  eval: number
  mate: number | null
  bestMove: string
  classification: MoveClassification | null
  cpLoss: number
}
