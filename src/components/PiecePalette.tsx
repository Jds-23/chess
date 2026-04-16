import {
  type ChessboardPiece,
  WHITE_PIECES,
  BLACK_PIECES,
  PIECE_LABELS,
} from '#/lib/chess-types'
import { cn } from '#/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'

const PIECE_UNICODE: Record<ChessboardPiece, string> = {
  wK: '\u2654', wQ: '\u2655', wR: '\u2656', wB: '\u2657', wN: '\u2658', wP: '\u2659',
  bK: '\u265A', bQ: '\u265B', bR: '\u265C', bB: '\u265D', bN: '\u265E', bP: '\u265F',
}

interface PiecePaletteProps {
  selectedPiece: ChessboardPiece | null
  onSelectPiece: (piece: ChessboardPiece | null) => void
}

export default function PiecePalette({ selectedPiece, onSelectPiece }: PiecePaletteProps) {
  function renderPieceButton(piece: ChessboardPiece) {
    const isActive = selectedPiece === piece
    return (
      <Tooltip key={piece}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onSelectPiece(isActive ? null : piece)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-colors',
              'hover:bg-accent',
              isActive && 'bg-primary text-primary-foreground ring-2 ring-ring',
            )}
          >
            {PIECE_UNICODE[piece]}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {PIECE_LABELS[piece]}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">White</p>
        <div className="flex gap-0.5">
          {WHITE_PIECES.map(renderPieceButton)}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Black</p>
        <div className="flex gap-0.5">
          {BLACK_PIECES.map(renderPieceButton)}
        </div>
      </div>
    </div>
  )
}
