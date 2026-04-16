import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TooltipProvider } from '#/components/ui/tooltip'
import BoardEditor from '#/components/BoardEditor'
import AnalysisPanel from '#/components/AnalysisPanel'
import RecentPositions from '#/components/RecentPositions'
import { analyzePositionFn } from '#/lib/analyze'
import { saveRecentPosition } from '#/lib/recent-positions'
import type { AnalysisResult } from '#/lib/analysis-types'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bestMoveArrow, setBestMoveArrow] = useState<
    Array<{ startSquare: string; endSquare: string; color: string }>
  >([])
  const [loadFenTrigger, setLoadFenTrigger] = useState<string | null>(null)
  const [analysisCount, setAnalysisCount] = useState(0)

  const handleAnalyze = useCallback(async (fen: string) => {
    setIsAnalyzing(true)
    setResult(null)
    setError(null)
    setBestMoveArrow([])
    try {
      const analysis = await analyzePositionFn({ data: { fen } })
      setResult(analysis)
      saveRecentPosition(analysis)
      setAnalysisCount(c => c + 1)
      if (analysis.bestMove && analysis.bestMove.length >= 4) {
        const from = analysis.bestMove.slice(0, 2)
        const to = analysis.bestMove.slice(2, 4)
        setBestMoveArrow([{ startSquare: from, endSquare: to, color: '#15803d' }])
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      setError(msg)
      console.error('Analysis failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleLoadRecent = useCallback((fen: string) => {
    setLoadFenTrigger(fen)
    setResult(null)
    setError(null)
    setBestMoveArrow([])
    // Clear trigger after a tick so BoardEditor picks it up
    setTimeout(() => setLoadFenTrigger(null), 0)
  }, [])

  return (
    <TooltipProvider>
      <main className="page-wrap px-4 pb-8 pt-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
          <section>
            <BoardEditor
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              arrows={bestMoveArrow}
              externalFen={loadFenTrigger}
            />
          </section>

          <section className="flex flex-col gap-4">
            <AnalysisPanel result={result} isLoading={isAnalyzing} error={error} />
            <RecentPositions key={analysisCount} onLoadPosition={handleLoadRecent} />
          </section>
        </div>
      </main>
    </TooltipProvider>
  )
}
