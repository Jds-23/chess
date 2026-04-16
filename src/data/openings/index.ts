import type { Opening } from './types'

import italianGame from './italian-game.json'
import ruyLopez from './ruy-lopez.json'
import sicilianDefense from './sicilian-defense.json'
import frenchDefense from './french-defense.json'
import caroKann from './caro-kann.json'

export const openings: Opening[] = [
  italianGame as Opening,
  ruyLopez as Opening,
  sicilianDefense as Opening,
  frenchDefense as Opening,
  caroKann as Opening,
]

export function getOpeningById(id: string): Opening | undefined {
  return openings.find(o => o.id === id)
}

export type { Opening, Variation, AnnotatedMove } from './types'
