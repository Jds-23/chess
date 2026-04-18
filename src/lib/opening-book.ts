import { Chess } from 'chess.js'
import type { Opening } from '#/data/openings/types'
import caroKann from '#/data/openings/caro-kann.json'
import french from '#/data/openings/french-defense.json'
import italian from '#/data/openings/italian-game.json'
import ruyLopez from '#/data/openings/ruy-lopez.json'
import sicilian from '#/data/openings/sicilian-defense.json'

const OPENINGS: Opening[] = [
  caroKann as Opening,
  french as Opening,
  italian as Opening,
  ruyLopez as Opening,
  sicilian as Opening,
]

function fenKey(fen: string): string {
  const parts = fen.split(' ')
  return `${parts[0]} ${parts[1]}`
}

function buildBook(): Set<string> {
  const set = new Set<string>()
  for (const opening of OPENINGS) {
    for (const variation of opening.variations) {
      const game = new Chess()
      set.add(fenKey(game.fen()))
      for (const m of variation.moves) {
        try {
          game.move(m.san)
          set.add(fenKey(game.fen()))
        } catch {
          break
        }
      }
    }
  }
  return set
}

const BOOK = buildBook()

export function isBookPosition(fen: string): boolean {
  return BOOK.has(fenKey(fen))
}
