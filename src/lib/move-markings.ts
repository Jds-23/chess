import { AlertCircle, AlertTriangle, BookOpen, Check, Sparkles, Star, ThumbsUp, Trophy, XCircle, type LucideIcon } from 'lucide-react'
import type { MoveClassification } from './chesscom-types'

export interface MarkingConfig {
  label: string
  icon: LucideIcon
  badgeClass: string
  squareTint: string
  arrowColor: string
  iconBgHex: string
}

export const MARKING_CONFIG: Record<MoveClassification, MarkingConfig> = {
  brilliant: {
    label: 'Brilliant',
    icon: Sparkles,
    badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    squareTint: 'rgba(34, 211, 238, 0.35)',
    arrowColor: '#22d3ee',
    iconBgHex: '#0891b2',
  },
  best: {
    label: 'Best',
    icon: Star,
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    squareTint: 'rgba(16, 185, 129, 0.35)',
    arrowColor: '#15803d',
    iconBgHex: '#059669',
  },
  excellent: {
    label: 'Excellent',
    icon: ThumbsUp,
    badgeClass: 'bg-green-500/15 text-green-400 border-green-500/30',
    squareTint: 'rgba(74, 222, 128, 0.32)',
    arrowColor: '#22c55e',
    iconBgHex: '#16a34a',
  },
  good: {
    label: 'Good',
    icon: Check,
    badgeClass: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
    squareTint: 'rgba(163, 230, 53, 0.3)',
    arrowColor: '#84cc16',
    iconBgHex: '#65a30d',
  },
  book: {
    label: 'Book',
    icon: BookOpen,
    badgeClass: 'bg-stone-500/15 text-stone-300 border-stone-500/30',
    squareTint: 'rgba(168, 162, 158, 0.3)',
    arrowColor: '#a8a29e',
    iconBgHex: '#78716c',
  },
  inaccuracy: {
    label: 'Inaccuracy',
    icon: AlertCircle,
    badgeClass: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    squareTint: 'rgba(250, 204, 21, 0.35)',
    arrowColor: '#eab308',
    iconBgHex: '#ca8a04',
  },
  mistake: {
    label: 'Mistake',
    icon: AlertTriangle,
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    squareTint: 'rgba(249, 115, 22, 0.4)',
    arrowColor: '#f97316',
    iconBgHex: '#ea580c',
  },
  blunder: {
    label: 'Blunder',
    icon: XCircle,
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    squareTint: 'rgba(239, 68, 68, 0.42)',
    arrowColor: '#dc2626',
    iconBgHex: '#b91c1c',
  },
  'missed-win': {
    label: 'Missed Win',
    icon: Trophy,
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    squareTint: 'rgba(168, 85, 247, 0.38)',
    arrowColor: '#a855f7',
    iconBgHex: '#7e22ce',
  },
}
