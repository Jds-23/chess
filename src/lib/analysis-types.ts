export interface AnalysisLine {
  eval: number
  moves: string[]
  depth: number
  multipv: number
}

export interface AnalysisResult {
  fen: string
  eval: number
  bestMove: string
  lines: AnalysisLine[]
  depth: number
  mate: number | null
}
