import type { MoveClassification as Classification } from '#/lib/chesscom-types'
import { cn } from '#/lib/utils'

const CLASSIFICATION_CONFIG: Record<Classification, { label: string; className: string }> = {
  brilliant: { label: 'Brilliant', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  best: { label: 'Best', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  excellent: { label: 'Excellent', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  good: { label: 'Good', className: 'bg-lime-500/15 text-lime-400 border-lime-500/30' },
  inaccuracy: { label: 'Inaccuracy', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  mistake: { label: 'Mistake', className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  blunder: { label: 'Blunder', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

interface MoveClassificationBadgeProps {
  classification: Classification
  className?: string
}

export default function MoveClassificationBadge({ classification, className }: MoveClassificationBadgeProps) {
  const config = CLASSIFICATION_CONFIG[classification]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
