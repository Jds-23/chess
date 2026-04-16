import { Button } from '#/components/ui/button'

interface MoveHistoryProps {
  moves: string[]
  onUndo: () => void
}

export default function MoveHistory({ moves, onUndo }: MoveHistoryProps) {
  // Group moves into pairs (white, black)
  const pairs: Array<[string, string | null]> = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1] ?? null])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Moves ({moves.length})
        </span>
        <Button variant="ghost" size="sm" onClick={onUndo} className="h-6 px-2 text-xs">
          Undo
        </Button>
      </div>
      <div className="flex max-h-32 flex-wrap gap-x-1 gap-y-0.5 overflow-y-auto rounded-lg border border-border bg-card p-2 font-mono text-xs">
        {pairs.map(([white, black], i) => (
          <span key={i} className="whitespace-nowrap">
            <span className="text-muted-foreground">{i + 1}.</span>
            <span className="ml-0.5 font-medium">{white}</span>
            {black && <span className="ml-1 font-medium">{black}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
