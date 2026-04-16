import type { ChessComGame } from '#/lib/chesscom-types'
import { cn } from '#/lib/utils'

interface GameListProps {
  games: ChessComGame[]
  username: string
  onSelectGame: (game: ChessComGame) => void
}

function resultLabel(result: string): string {
  switch (result) {
    case 'win': return 'Won'
    case 'resigned': case 'timeout': case 'abandoned': case 'checkmated': return 'Lost'
    case 'stalemate': case 'agreed': case 'repetition': case 'insufficient':
    case 'timevsinsufficient': case '50move': return 'Draw'
    default: return result
  }
}

function resultColor(result: string): string {
  switch (result) {
    case 'win': return 'text-emerald-400'
    case 'resigned': case 'timeout': case 'abandoned': case 'checkmated': return 'text-red-400'
    default: return 'text-yellow-400'
  }
}

function timeClassIcon(tc: string): string {
  switch (tc) {
    case 'bullet': return '\u26A1'
    case 'blitz': return '\u{1F525}'
    case 'rapid': return '\u{1F551}'
    case 'daily': return '\u{1F4C5}'
    default: return '\u265F'
  }
}

export default function GameList({ games, username, onSelectGame }: GameListProps) {
  const lowerUser = username.toLowerCase()

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-[var(--sea-ink)]">
        Recent Games ({games.length})
      </h2>
      <div className="flex flex-col gap-1.5">
        {games.map((game) => {
          const isWhite = game.white.username.toLowerCase() === lowerUser
          const playerSide = isWhite ? game.white : game.black
          const opponent = isWhite ? game.black : game.white
          const playerResult = playerSide.result
          const date = new Date(game.end_time * 1000)

          return (
            <button
              type="button"
              key={game.url}
              onClick={() => onSelectGame(game)}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
            >
              <span className="text-lg" title={game.time_class}>
                {timeClassIcon(game.time_class)}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    vs {opponent.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({opponent.rating})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{isWhite ? 'White' : 'Black'}</span>
                  <span>&middot;</span>
                  <span>{date.toLocaleDateString()}</span>
                </div>
              </div>

              <span className={cn('text-sm font-semibold', resultColor(playerResult))}>
                {resultLabel(playerResult)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
