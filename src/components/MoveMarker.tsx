import type { MoveClassification } from '#/lib/chesscom-types'
import { MARKING_CONFIG } from '#/lib/move-markings'

interface MoveMarkerProps {
  square: string
  classification: MoveClassification
  boardOrientation: 'white' | 'black'
}

export default function MoveMarker({ square, classification, boardOrientation }: MoveMarkerProps) {
  const config = MARKING_CONFIG[classification]
  const Icon = config.icon

  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = parseInt(square[1], 10) - 1

  const col = boardOrientation === 'white' ? file : 7 - file
  const row = boardOrientation === 'white' ? 7 - rank : rank

  const leftPct = ((col + 1) / 8) * 100
  const topPct = (row / 8) * 100

  return (
    <div
      className="pointer-events-none absolute z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md ring-2 ring-white"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: 'translate(-60%, -40%)',
        backgroundColor: config.iconBgHex,
      }}
    >
      <Icon className="h-3.5 w-3.5 text-white" strokeWidth={3} />
    </div>
  )
}
