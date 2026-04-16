export interface AnnotatedMove {
  san: string
  commentary: string
}

export interface Variation {
  id: string
  name: string
  moves: AnnotatedMove[]
}

export interface Opening {
  id: string
  name: string
  eco: string
  description: string
  variations: Variation[]
}
