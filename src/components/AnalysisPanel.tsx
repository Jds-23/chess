import type { AnalysisResult, AnalysisLine } from '#/lib/analysis-types'
import EvalBar from './EvalBar'

interface AnalysisPanelProps {
  result: AnalysisResult | null
  isLoading: boolean
  error?: string | null
}

function formatEvalShort(cp: number): string {
  const pawns = cp / 100
  if (Math.abs(cp) >= 99_000) {
    const mate = cp > 0 ? 100_000 - cp : -(100_000 + cp)
    return mate > 0 ? `M${mate}` : `M${mate}`
  }
  return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1)
}

function uciToSan(move: string): string {
  // Simple UCI display — full SAN conversion needs chess.js integration
  return move
}

function PvLine({ line, index }: { line: AnalysisLine; index: number }) {
  const evalStr = formatEvalShort(line.eval)
  const isPositive = line.eval >= 0

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
      <span
        className={`inline-flex min-w-[3.5rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold ${
          isPositive
            ? 'bg-white text-zinc-800'
            : 'bg-zinc-800 text-white'
        }`}
      >
        {evalStr}
      </span>
      <div className="flex flex-wrap gap-1 text-sm text-foreground">
        {line.moves.slice(0, 12).map((move, i) => (
          <span key={`${move}-${i}`} className="font-mono text-xs">
            {i % 2 === 0 && (
              <span className="mr-0.5 text-muted-foreground">
                {Math.floor(i / 2) + 1}.
              </span>
            )}
            {uciToSan(move)}
          </span>
        ))}
        {line.moves.length > 12 && (
          <span className="text-xs text-muted-foreground">...</span>
        )}
      </div>
    </div>
  )
}

export default function AnalysisPanel({ result, isLoading, error }: AnalysisPanelProps) {
  if (error) {
    return (
      <div className="island-shell rounded-2xl p-6">
        <h2 className="mb-2 text-lg font-semibold text-destructive">Analysis Error</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">Try again or adjust the position.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="island-shell flex flex-col items-center justify-center gap-3 rounded-2xl p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Engine thinking...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="island-shell rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
          Analysis
        </h2>
        <p className="text-sm text-muted-foreground">
          Set up a position and click Analyze to see engine evaluation.
        </p>
      </div>
    )
  }

  return (
    <div className="island-shell flex gap-3 rounded-2xl p-4">
      {/* Eval Bar */}
      <div className="hidden h-64 sm:block">
        <EvalBar eval={result.eval} mate={result.mate} />
      </div>

      {/* Lines */}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-[var(--sea-ink)]">
            Engine Analysis
          </h2>
          <span className="text-xs text-muted-foreground">
            Depth {result.depth}
          </span>
        </div>

        {/* Mobile eval display */}
        <div className="flex items-center gap-2 sm:hidden">
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-sm font-bold ${
              result.eval >= 0
                ? 'bg-white text-zinc-800'
                : 'bg-zinc-800 text-white'
            }`}
          >
            {formatEvalShort(result.eval)}
          </span>
          <span className="text-xs text-muted-foreground">
            Best: {result.bestMove}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {result.lines.map((line, i) => (
            <PvLine key={line.multipv} line={line} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
