import { cn } from '#/lib/utils'

interface EvalBarProps {
  eval: number
  mate: number | null
}

function evalToPercent(cp: number): number {
  // Sigmoid-like mapping: +-500cp maps to ~10-90%
  const clamped = Math.max(-1000, Math.min(1000, cp))
  return 50 + 50 * (2 / (1 + Math.exp(-0.005 * clamped)) - 1)
}

function formatEval(cp: number, mate: number | null): string {
  if (mate != null) {
    return mate > 0 ? `M${mate}` : `M${mate}`
  }
  const pawns = cp / 100
  return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1)
}

export default function EvalBar({ eval: evalScore, mate }: EvalBarProps) {
  const whitePercent = mate != null
    ? (mate > 0 ? 95 : 5)
    : evalToPercent(evalScore)

  const label = formatEval(evalScore, mate)
  const isWhiteAdvantage = mate != null ? mate > 0 : evalScore >= 0

  return (
    <div className="flex h-full w-8 flex-col overflow-hidden rounded-md border border-border">
      {/* Black side (top) */}
      <div
        className="relative bg-zinc-800 transition-all duration-500"
        style={{ height: `${100 - whitePercent}%` }}
      >
        {!isWhiteAdvantage && (
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white">
            {label}
          </span>
        )}
      </div>
      {/* White side (bottom) */}
      <div
        className="relative flex-1 bg-white transition-all duration-500"
      >
        {isWhiteAdvantage && (
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-800">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
