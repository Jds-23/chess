import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TooltipProvider } from '#/components/ui/tooltip'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import GameList from '#/components/GameList'
import GameReview from '#/components/GameReview'
import { fetchPlayerGamesFn } from '#/lib/chesscom-api'
import type { ChessComGame } from '#/lib/chesscom-types'

export const Route = createFileRoute('/games')({ component: GamesPage })

function GamesPage() {
  const [username, setUsername] = useState('')
  const [games, setGames] = useState<ChessComGame[] | null>(null)
  const [selectedGame, setSelectedGame] = useState<ChessComGame | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedUsername, setFetchedUsername] = useState('')

  const handleFetchGames = useCallback(async () => {
    if (!username.trim()) return
    setIsLoading(true)
    setError(null)
    setGames(null)
    setSelectedGame(null)
    try {
      const result = await fetchPlayerGamesFn({ data: { username: username.trim() } })
      setGames(result)
      setFetchedUsername(username.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games')
    } finally {
      setIsLoading(false)
    }
  }, [username])

  const handleBack = useCallback(() => {
    setSelectedGame(null)
  }, [])

  return (
    <TooltipProvider>
      <main className="page-wrap px-4 pb-8 pt-6">
        {selectedGame ? (
          <GameReview game={selectedGame} username={fetchedUsername} onBack={handleBack} />
        ) : (
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-6 text-xl font-semibold text-[var(--sea-ink)]">
              Analyze Your Game
            </h1>

            {/* Username input */}
            <div className="island-shell mb-6 flex flex-col gap-3 rounded-2xl p-6">
              <Label htmlFor="chess-username" className="text-sm font-medium">
                Chess.com Username
              </Label>
              <div className="flex gap-2">
                <Input
                  id="chess-username"
                  placeholder="e.g. hikaru"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchGames()}
                  className="flex-1"
                />
                <Button
                  onClick={handleFetchGames}
                  disabled={isLoading || !username.trim()}
                >
                  {isLoading ? 'Loading...' : 'Fetch Games'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a Chess.com username to load their recent games for analysis.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="island-shell mb-4 rounded-2xl border-destructive/30 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center gap-3 py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <p className="text-sm text-muted-foreground">Fetching games...</p>
              </div>
            )}

            {/* Game list */}
            {games && !isLoading && (
              <div className="island-shell rounded-2xl p-4">
                {games.length > 0 ? (
                  <GameList games={games} username={fetchedUsername} onSelectGame={setSelectedGame} />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No standard chess games found for this month.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </TooltipProvider>
  )
}
