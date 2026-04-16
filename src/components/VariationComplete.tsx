import { useState, useEffect, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import EvalBar from './EvalBar'
import { Button } from '#/components/ui/button'
import { analyzePositionFn } from '#/lib/analyze'
import { analyzePositionAdvantages } from '#/lib/position-advantages'
import type { Variation } from '#/data/openings/types'
import type { AnalysisResult } from '#/lib/analysis-types'
import type { BoardAnnotation } from '#/lib/position-advantages'

interface VariationCompleteProps {
  variation: Variation
  playerColor: 'white' | 'black'
  onContinue: () => void
}

function annotationsToArrows(items: BoardAnnotation[]) {
  const result: Array<{ startSquare: string; endSquare: string; color: string }> = []
  for (const a of items) {
    if (a.type === 'arrow' && a.from && a.to) {
      result.push({ startSquare: a.from, endSquare: a.to, color: a.color })
    }
  }
  return result
}

function annotationsToStyles(items: BoardAnnotation[]) {
  const styles: Record<string, React.CSSProperties> = {}
  for (const a of items) {
    if (a.type === 'highlight' && a.square) {
      styles[a.square] = { backgroundColor: a.color }
    }
  }
  return styles
}

export default function VariationComplete({ variation, playerColor, onContinue }: VariationCompleteProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(true)

  // Replay all moves to get final position
  const finalFen = useMemo(() => {
    try {
      const game = new Chess()
      for (const move of variation.moves) {
        game.move(move.san)
      }
      return game.fen()
    } catch {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
  }, [variation])

  const perspective = playerColor === 'white' ? 'w' : 'b'

  // Auto-detect advantages
  const positionAnalysis = useMemo(() => {
    try {
      return analyzePositionAdvantages(finalFen, perspective as 'w' | 'b')
    } catch {
      return { advantages: [], annotations: [] }
    }
  }, [finalFen, perspective])

  const arrows = useMemo(() => annotationsToArrows(positionAnalysis.annotations), [positionAnalysis])
  const highlightStyles = useMemo(() => annotationsToStyles(positionAnalysis.annotations), [positionAnalysis])

  // Live Stockfish eval
  useEffect(() => {
    let cancelled = false
    setAnalysisLoading(true)
    analyzePositionFn({ data: { fen: finalFen, depth: 16, multiPv: 1 } })
      .then(result => {
        if (!cancelled) {
          setAnalysis(result)
          setAnalysisLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setAnalysisLoading(false)
      })
    return () => { cancelled = true }
  }, [finalFen])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
          Complete
        </span>
        <h3 className="text-sm font-semibold">{variation.name}</h3>
      </div>

      {/* Board + Eval Bar */}
      <div className="flex items-stretch gap-2">
        {/* Eval bar */}
        <div className="hidden sm:block" style={{ minHeight: 300 }}>
          {analysis ? (
            <EvalBar eval={analysis.eval} mate={analysis.mate} />
          ) : (
            <div className="flex h-full w-8 items-center justify-center rounded-md border border-border bg-muted">
              <span className="animate-pulse text-[10px] text-muted-foreground">...</span>
            </div>
          )}
        </div>

        {/* Board */}
        <div className="relative w-full max-w-[560px]">
          <Chessboard
            options={{
              id: 'variation-complete-board',
              position: finalFen,
              boardOrientation: playerColor,
              boardStyle: {
                borderRadius: '8px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              },
              darkSquareStyle: { backgroundColor: '#779952' },
              lightSquareStyle: { backgroundColor: '#edeed1' },
              arrows: arrows,
              squareStyles: highlightStyles,
              animationDurationInMs: 0,
            }}
          />
        </div>
      </div>

      {/* Mobile eval */}
      {analysis && (
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-xs text-muted-foreground">Eval:</span>
          <span className="text-sm font-bold">
            {analysis.mate != null
              ? `Mate in ${Math.abs(analysis.mate)}`
              : `${analysis.eval >= 0 ? '+' : ''}${(analysis.eval / 100).toFixed(1)}`}
          </span>
        </div>
      )}

      {/* Advantages panel */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Position Advantages
        </h4>

        {positionAnalysis.advantages.length > 0 ? (
          <ul className="space-y-2">
            {positionAnalysis.advantages.map((adv, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  adv.type === 'tactical'
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                  {adv.type === 'tactical' ? 'tactic' : 'strategy'}
                </span>
                <div>
                  <span className="text-sm font-medium">{adv.label}</span>
                  <p className="text-xs text-muted-foreground">{adv.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Balanced position — both sides have equal chances. Focus on your plan from here.
          </p>
        )}

        {/* Eval summary */}
        {analysis && !analysisLoading && (
          <div className="mt-3 border-t border-border pt-2">
            <p className="text-xs text-muted-foreground">
              Stockfish evaluation:{' '}
              <span className="font-semibold text-foreground">
                {analysis.mate != null
                  ? `Mate in ${Math.abs(analysis.mate)} for ${analysis.mate > 0 ? 'White' : 'Black'}`
                  : `${analysis.eval >= 0 ? '+' : ''}${(analysis.eval / 100).toFixed(1)} (${
                      Math.abs(analysis.eval) < 30 ? 'equal'
                      : analysis.eval > 0 ? 'White is better' : 'Black is better'
                    })`}
              </span>
            </p>
          </div>
        )}
      </div>

      <Button onClick={onContinue} size="lg" className="w-full">
        Got it, continue
      </Button>
    </div>
  )
}
