import { useState, useCallback, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import type { Arrow } from 'react-chessboard/dist/types'
import { Button } from '#/components/ui/button'
import EvalBar from './EvalBar'
import MoveClassificationBadge from './MoveClassification'
import { analyzePositionFn } from '#/lib/analyze'
import { parsePgn, classifyMove, calculateCpLoss } from '#/lib/game-analysis'
import type { ChessComGame, ParsedMove, MoveAnalysis } from '#/lib/chesscom-types'
import type { AnalysisResult } from '#/lib/analysis-types'
import { cn } from '#/lib/utils'
import { STARTING_FEN } from '#/lib/chess-types'

interface GameReviewProps {
  game: ChessComGame
  username: string
  onBack: () => void
}

export default function GameReview({ game, username, onBack }: GameReviewProps) {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase()
  const opponent = isWhite ? game.black : game.white

  const [moves] = useState<ParsedMove[]>(() => parsePgn(game.pgn))
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1) // -1 = starting position
  const [analysisCache, setAnalysisCache] = useState<Map<number, AnalysisResult>>(new Map())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [moveAnalyses, setMoveAnalyses] = useState<Map<number, MoveAnalysis>>(new Map())
  const moveListRef = useRef<HTMLDivElement>(null)

  // Current position FEN
  const currentFen = currentMoveIndex < 0
    ? STARTING_FEN
    : moves[currentMoveIndex].fenAfter

  // Current move's analysis
  const currentAnalysis = analysisCache.get(currentMoveIndex)

  // Best move arrow
  const arrows: Arrow[] = []
  if (currentAnalysis?.bestMove && currentAnalysis.bestMove.length >= 4) {
    arrows.push({
      startSquare: currentAnalysis.bestMove.slice(0, 2),
      endSquare: currentAnalysis.bestMove.slice(2, 4),
      color: '#15803d',
    })
  }

  // Analyze current position
  const analyzeCurrentPosition = useCallback(async (moveIdx: number) => {
    if (analysisCache.has(moveIdx)) return

    const fen = moveIdx < 0 ? STARTING_FEN : moves[moveIdx].fenAfter
    setIsAnalyzing(true)
    try {
      const result = await analyzePositionFn({ data: { fen, depth: 18, multiPv: 1 } })
      setAnalysisCache(prev => {
        const next = new Map(prev)
        next.set(moveIdx, result)
        return next
      })

      // If we have analysis for the position before this move, classify it
      if (moveIdx >= 0) {
        const prevIdx = moveIdx - 1
        const prevAnalysis = analysisCache.get(prevIdx)
        if (prevAnalysis) {
          computeMoveClassification(moveIdx, prevAnalysis, result)
        }
      }
    } catch (err) {
      console.error('Analysis failed for move', moveIdx, err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [analysisCache, moves])

  const computeMoveClassification = useCallback((moveIdx: number, prevAnalysis: AnalysisResult, currentAnalysisResult: AnalysisResult) => {
    const move = moves[moveIdx]
    const evalBefore = prevAnalysis.eval
    const evalAfter = currentAnalysisResult.eval
    const cpLoss = calculateCpLoss(evalBefore, evalAfter, move.color)
    const isPlayerBestMove = move.uci === prevAnalysis.bestMove
    const classification = classifyMove(cpLoss, isPlayerBestMove)

    setMoveAnalyses(prev => {
      const next = new Map(prev)
      next.set(moveIdx, {
        move,
        eval: currentAnalysisResult.eval,
        mate: currentAnalysisResult.mate,
        bestMove: prevAnalysis.bestMove,
        classification,
        cpLoss,
      })
      return next
    })
  }, [moves])

  // Auto-analyze when stepping through moves
  useEffect(() => {
    analyzeCurrentPosition(currentMoveIndex)
  }, [currentMoveIndex, analyzeCurrentPosition])

  // Recompute classifications when cache updates
  useEffect(() => {
    for (let i = 0; i < moves.length; i++) {
      if (moveAnalyses.has(i)) continue
      const prevAnalysis = analysisCache.get(i - 1)
      const currAnalysis = analysisCache.get(i)
      if (prevAnalysis && currAnalysis) {
        computeMoveClassification(i, prevAnalysis, currAnalysis)
      }
    }
  }, [analysisCache, moves.length, moveAnalyses, computeMoveClassification])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentMoveIndex(prev => Math.max(-1, prev - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentMoveIndex(prev => Math.min(moves.length - 1, prev + 1))
      } else if (e.key === 'Home') {
        e.preventDefault()
        setCurrentMoveIndex(-1)
      } else if (e.key === 'End') {
        e.preventDefault()
        setCurrentMoveIndex(moves.length - 1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [moves.length])

  // Scroll active move into view
  useEffect(() => {
    if (!moveListRef.current) return
    const active = moveListRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentMoveIndex])

  const currentMoveAnalysis = currentMoveIndex >= 0 ? moveAnalyses.get(currentMoveIndex) : null

  // Group moves into pairs for display
  const movePairs: Array<{ number: number; white: { idx: number; move: ParsedMove } | null; black: { idx: number; move: ParsedMove } | null }> = []
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: { idx: i, move: moves[i] },
      black: i + 1 < moves.length ? { idx: i + 1, move: moves[i + 1] } : null,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          &larr; Back
        </Button>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">
            vs {opponent.username} ({opponent.rating})
          </div>
          <div className="text-xs text-muted-foreground">
            {isWhite ? 'White' : 'Black'} &middot; {game.time_class} &middot; {new Date(game.end_time * 1000).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
        {/* Board + nav */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            {/* Eval bar */}
            {currentAnalysis && (
              <div className="hidden h-[560px] sm:block">
                <EvalBar eval={currentAnalysis.eval} mate={currentAnalysis.mate} />
              </div>
            )}

            <div className="relative w-full max-w-[560px]">
              <Chessboard
                options={{
                  id: 'game-review',
                  position: currentFen,
                  boardOrientation: isWhite ? 'white' : 'black',
                  boardStyle: {
                    borderRadius: '8px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                  },
                  darkSquareStyle: { backgroundColor: '#779952' },
                  lightSquareStyle: { backgroundColor: '#edeed1' },
                  arrows,
                  animationDurationInMs: 150,
                  arePiecesDraggable: false,
                }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMoveIndex(-1)} disabled={currentMoveIndex < 0}>
              &laquo;
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMoveIndex(prev => Math.max(-1, prev - 1))} disabled={currentMoveIndex < 0}>
              &lsaquo;
            </Button>
            <span className="min-w-[4rem] text-center text-xs text-muted-foreground">
              {currentMoveIndex < 0
                ? 'Start'
                : `${moves[currentMoveIndex].moveNumber}. ${moves[currentMoveIndex].color === 'w' ? '' : '...'}${moves[currentMoveIndex].san}`}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMoveIndex(prev => Math.min(moves.length - 1, prev + 1))} disabled={currentMoveIndex >= moves.length - 1}>
              &rsaquo;
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMoveIndex(moves.length - 1)} disabled={currentMoveIndex >= moves.length - 1}>
              &raquo;
            </Button>
          </div>

          {/* Current move info */}
          {currentMoveAnalysis && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
              <MoveClassificationBadge classification={currentMoveAnalysis.classification!} />
              {currentMoveAnalysis.cpLoss > 0 && (
                <span className="text-xs text-muted-foreground">
                  {currentMoveAnalysis.cpLoss > 0 ? `-${(currentMoveAnalysis.cpLoss / 100).toFixed(1)}` : '0'} pawns
                </span>
              )}
              {currentMoveAnalysis.bestMove && currentMoveAnalysis.move.uci !== currentMoveAnalysis.bestMove && (
                <span className="text-xs text-muted-foreground">
                  Best: {currentMoveAnalysis.bestMove}
                </span>
              )}
              {isAnalyzing && (
                <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              )}
            </div>
          )}

          {!currentMoveAnalysis && isAnalyzing && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <span className="text-xs text-muted-foreground">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Move list */}
        <div className="island-shell flex flex-col gap-2 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-[var(--sea-ink)]">Moves</h3>
          <div
            ref={moveListRef}
            className="max-h-[480px] overflow-y-auto font-mono text-xs"
          >
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-8" />
                <col />
                <col />
              </colgroup>
              <tbody>
                {movePairs.map((pair) => (
                  <tr key={pair.number} className="border-b border-border/30 last:border-b-0">
                    <td className="py-1 pr-1 text-right align-middle text-muted-foreground">
                      {pair.number}.
                    </td>

                    {/* White move */}
                    <td className="py-0.5 align-middle">
                      {pair.white && (
                        <button
                          type="button"
                          data-active={currentMoveIndex === pair.white.idx}
                          onClick={() => setCurrentMoveIndex(pair.white!.idx)}
                          className={cn(
                            'grid w-full grid-cols-[minmax(2.5rem,auto)_minmax(0,1fr)] items-center gap-x-1.5 rounded px-1.5 py-1 transition-colors',
                            currentMoveIndex === pair.white.idx
                              ? 'bg-primary/15 text-primary font-bold'
                              : 'hover:bg-accent',
                          )}
                        >
                          <span className="truncate text-left">{pair.white.move.san}</span>
                          <span className="justify-self-start">
                            {moveAnalyses.has(pair.white.idx) && moveAnalyses.get(pair.white.idx)!.classification && (
                              <MoveClassificationBadge classification={moveAnalyses.get(pair.white.idx)!.classification!} />
                            )}
                          </span>
                        </button>
                      )}
                    </td>

                    {/* Black move */}
                    <td className="py-0.5 align-middle">
                      {pair.black && (
                        <button
                          type="button"
                          data-active={currentMoveIndex === pair.black.idx}
                          onClick={() => setCurrentMoveIndex(pair.black!.idx)}
                          className={cn(
                            'grid w-full grid-cols-[minmax(2.5rem,auto)_minmax(0,1fr)] items-center gap-x-1.5 rounded px-1.5 py-1 transition-colors',
                            currentMoveIndex === pair.black.idx
                              ? 'bg-primary/15 text-primary font-bold'
                              : 'hover:bg-accent',
                          )}
                        >
                          <span className="truncate text-left">{pair.black.move.san}</span>
                          <span className="justify-self-start">
                            {moveAnalyses.has(pair.black.idx) && moveAnalyses.get(pair.black.idx)!.classification && (
                              <MoveClassificationBadge classification={moveAnalyses.get(pair.black.idx)!.classification!} />
                            )}
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
