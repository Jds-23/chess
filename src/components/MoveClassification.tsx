import type { MoveClassification as Classification } from '#/lib/chesscom-types'
import { MARKING_CONFIG } from '#/lib/move-markings'
import { cn } from '#/lib/utils'

interface MoveClassificationBadgeProps {
  classification: Classification
  className?: string
}

export default function MoveClassificationBadge({ classification, className }: MoveClassificationBadgeProps) {
  const config = MARKING_CONFIG[classification]
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
        config.badgeClass,
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {config.label}
    </span>
  )
}
