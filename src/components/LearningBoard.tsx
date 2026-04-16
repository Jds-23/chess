import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

interface LearningBoardProps {
  /** Which color the user is playing */
  playerColor: 'white' | 'black'
  /** Current move sequence to play through */
  moves: string[]
  /** Current move index (0-based, points to the next move to be played) */
  moveIndex: number
  /** Called when the user plays the correct move */
  onCorrectMove: () => void
  /** Called when the user plays a wrong move */
  onWrongMove: () => void
  /** Whether the board accepts user input */
  interactive: boolean
  /** Optional key to force board reset */
  resetKey?: number
  /** Show a green hint arrow for the player's next move */
  showHintArrow?: boolean
}

export default function LearningBoard({
  playerColor,
  moves,
  moveIndex,
  onCorrectMove,
  onWrongMove,
  interactive,
  resetKey,
  showHintArrow = false,
}: LearningBoardProps) {
  const gameRef = useRef<Chess>(new Chess())
  const [gameVersion, setGameVersion] = useState(0)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [lastWrongSquare, setLastWrongSquare] = useState<string | null>(null)

  const playerTurn = playerColor === 'white' ? 'w' : 'b'
  const isPlayerTurn = moveIndex < moves.length && gameRef.current.turn() === playerTurn

  // Reset board when moves/resetKey changes
  useEffect(() => {
    const game = new Chess()
    // Replay moves up to moveIndex
    for (let i = 0; i < moveIndex; i++) {
      try {
        game.move(moves[i])
      } catch {
        break
      }
    }
    gameRef.current = game
    setGameVersion(v => v + 1)
    setSelectedSquare(null)
    setLastWrongSquare(null)
  }, [moves, moveIndex, resetKey])

  // Auto-play opponent moves
  useEffect(() => {
    if (!interactive) return
    if (moveIndex >= moves.length) return

    const game = gameRef.current
    const isOpponentTurn = game.turn() !== playerTurn

    if (isOpponentTurn) {
      const timer = setTimeout(() => {
        try {
          game.move(moves[moveIndex])
          setGameVersion(v => v + 1)
          onCorrectMove() // advance moveIndex from parent
        } catch {
          // invalid move in data
        }
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [interactive, moveIndex, moves, playerTurn, onCorrectMove])

  // Legal moves for selected square
  const legalMoves = useMemo(() => {
    if (!selectedSquare || !isPlayerTurn) return []
    try {
      return gameRef.current.moves({
        square: selectedSquare as Parameters<typeof gameRef.current.moves>[0]['square'],
        verbose: true,
      })
    } catch {
      return []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSquare, gameVersion, isPlayerTurn])

  // Compute hint arrow for the player's expected move
  const hintArrow = useMemo(() => {
    if (!showHintArrow || !isPlayerTurn || moveIndex >= moves.length) return []
    const game = gameRef.current
    try {
      const clone = new Chess(game.fen())
      const result = clone.move(moves[moveIndex])
      if (result) {
        return [{ startSquare: result.from, endSquare: result.to, color: 'rgba(21, 128, 61, 0.7)' }]
      }
    } catch { /* invalid move */ }
    return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHintArrow, isPlayerTurn, moveIndex, moves, gameVersion])

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {}

    if (selectedSquare && isPlayerTurn) {
      styles[selectedSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
      for (const move of legalMoves) {
        styles[move.to] = {
          background: move.captured
            ? 'radial-gradient(circle, transparent 55%, rgba(0, 0, 0, 0.25) 55%)'
            : 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 25%, transparent 25%)',
        }
      }
    }

    if (lastWrongSquare) {
      styles[lastWrongSquare] = { backgroundColor: 'rgba(239, 68, 68, 0.4)' }
    }

    return styles
  }, [selectedSquare, isPlayerTurn, legalMoves, lastWrongSquare])

  const tryMove = useCallback(
    (from: string, to: string) => {
      if (!interactive || !isPlayerTurn) return false
      if (moveIndex >= moves.length) return false

      const expectedSan = moves[moveIndex]
      const game = gameRef.current

      try {
        const result = game.move({ from, to, promotion: 'q' })
        if (result.san === expectedSan) {
          setGameVersion(v => v + 1)
          setSelectedSquare(null)
          setLastWrongSquare(null)
          onCorrectMove()
          return true
        }
        // Wrong move — undo and snap back
        game.undo()
        setGameVersion(v => v + 1)
        setSelectedSquare(null)
        setLastWrongSquare(to)
        onWrongMove()
        setTimeout(() => setLastWrongSquare(null), 800)
        return false
      } catch {
        return false
      }
    },
    [interactive, isPlayerTurn, moveIndex, moves, onCorrectMove, onWrongMove],
  )

  const handleSquareClick = useCallback(
    ({ piece, square }: { piece: { pieceType: string } | null; square: string }) => {
      if (!interactive || !isPlayerTurn) return

      const game = gameRef.current
      const pieceColor = piece ? (piece.pieceType[0] === 'w' ? 'w' : 'b') as 'w' | 'b' : undefined

      // Try to execute move if we have a selected square
      if (selectedSquare && selectedSquare !== square) {
        const isLegal = legalMoves.some(m => m.to === square)
        if (isLegal) {
          tryMove(selectedSquare, square)
          return
        }
      }

      // Toggle selection
      if (selectedSquare === square) {
        setSelectedSquare(null)
        return
      }

      if (piece && pieceColor === game.turn()) {
        setSelectedSquare(square)
        return
      }

      setSelectedSquare(null)
    },
    [interactive, isPlayerTurn, selectedSquare, legalMoves, tryMove],
  )

  const handlePieceClick = useCallback(
    ({ piece, square }: { isSparePiece: boolean; piece: { pieceType: string }; square: string | null }) => {
      if (!square) return
      const pieceColor = (piece.pieceType[0] === 'w' ? 'w' : 'b') as 'w' | 'b'
      handleSquareClick({ piece: { pieceType: piece.pieceType }, square })

      // If we had a selection and clicked a different own piece, reselect
      if (selectedSquare && selectedSquare !== square && pieceColor === gameRef.current.turn()) {
        setSelectedSquare(square)
      }
    },
    [handleSquareClick, selectedSquare],
  )

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: {
      piece: { pieceType: string; isSparePiece: boolean; position: string }
      sourceSquare: string
      targetSquare: string | null
    }) => {
      if (!targetSquare) return false
      return tryMove(sourceSquare, targetSquare)
    },
    [tryMove],
  )

  return (
    <div className="relative w-full max-w-[560px]">
      <Chessboard
        options={{
          id: 'learning-board',
          position: gameRef.current.fen(),
          onSquareClick: handleSquareClick,
          onPieceClick: handlePieceClick,
          onPieceDrop: handlePieceDrop,
          boardOrientation: playerColor,
          boardStyle: {
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          },
          darkSquareStyle: { backgroundColor: '#779952' },
          lightSquareStyle: { backgroundColor: '#edeed1' },
          squareStyles: squareStyles,
          arrows: hintArrow,
          animationDurationInMs: 200,
        }}
      />
    </div>
  )
}
