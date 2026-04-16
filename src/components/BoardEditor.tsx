import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { Arrow } from 'react-chessboard/dist/types'
import PiecePalette from './PiecePalette'
import FenInput from './FenInput'
import MoveHistory from './MoveHistory'
import { Button } from '#/components/ui/button'
import {
  type ChessboardPiece,
  type BoardPosition,
  type PieceColor,
  STARTING_FEN,
  fenToPosition,
  positionToFen,
  fenSideToMove,
} from '#/lib/chess-types'
import { cn } from '#/lib/utils'

function fenCharToBoardPiece(fenChar: string): ChessboardPiece | null {
  const map: Record<string, ChessboardPiece> = {
    P: 'wP', N: 'wN', B: 'wB', R: 'wR', Q: 'wQ', K: 'wK',
    p: 'bP', n: 'bN', b: 'bB', r: 'bR', q: 'bQ', k: 'bK',
  }
  return map[fenChar] ?? null
}

type BoardMode = 'edit' | 'play'

interface BoardEditorProps {
  onAnalyze?: (fen: string) => void
  isAnalyzing?: boolean
  arrows?: Arrow[]
  onFenChange?: (fen: string) => void
  externalFen?: string | null
}

export default function BoardEditor({ onAnalyze, isAnalyzing, arrows: externalArrows, onFenChange, externalFen }: BoardEditorProps) {
  // Edit mode state
  const [editPosition, setEditPosition] = useState<BoardPosition>({})
  const [editSideToMove, setEditSideToMove] = useState<PieceColor>('w')
  const [selectedPiece, setSelectedPiece] = useState<ChessboardPiece | null>(null)

  // Play mode state
  const gameRef = useRef<Chess>(new Chess())
  const [gameVersion, setGameVersion] = useState(0) // force re-render on game change
  const [mode, setMode] = useState<BoardMode>('edit')
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)

  const editFen = useMemo(() => positionToFen(editPosition, editSideToMove), [editPosition, editSideToMove])
  const gameFen = gameRef.current.fen()
  const fen = mode === 'edit' ? editFen : gameFen

  const moveHistory = mode === 'play' ? gameRef.current.history() : []
  const isGameOver = mode === 'play' && gameRef.current.isGameOver()
  const isCheck = mode === 'play' && gameRef.current.isCheck()

  // Legal moves for selected square (play mode click-to-move)
  const legalMoves = useMemo(() => {
    if (mode !== 'play' || !selectedSquare) return []
    try {
      return gameRef.current.moves({ square: selectedSquare as Parameters<typeof gameRef.current.moves>[0]['square'], verbose: true })
    } catch {
      return []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedSquare, gameVersion])

  // Square highlight styles for selected piece + legal moves
  const playSquareStyles = useMemo(() => {
    if (mode !== 'play' || !selectedSquare) return {}
    const styles: Record<string, React.CSSProperties> = {}

    // Highlight selected square
    styles[selectedSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' }

    // Highlight legal move targets
    for (const move of legalMoves) {
      const isCapture = move.captured
      styles[move.to] = {
        background: isCapture
          ? 'radial-gradient(circle, transparent 55%, rgba(0, 0, 0, 0.25) 55%)'
          : 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 25%, transparent 25%)',
        borderRadius: isCapture ? '0' : '50%',
      }
    }
    return styles
  }, [mode, selectedSquare, legalMoves])

  // Notify parent of FEN changes
  const notifyFen = useCallback((newFen: string) => {
    onFenChange?.(newFen)
  }, [onFenChange])

  // --- Edit mode handlers ---
  const handleEditSquareClick = useCallback(
    ({ square }: { piece: { pieceType: string } | null; square: string }) => {
      if (!selectedPiece) return
      setEditPosition((prev) => ({ ...prev, [square]: selectedPiece }))
    },
    [selectedPiece],
  )

  const handleEditSquareRightClick = useCallback(
    ({ square }: { piece: { pieceType: string } | null; square: string }) => {
      setEditPosition((prev) => {
        const next = { ...prev }
        delete next[square]
        return next
      })
    },
    [],
  )

  const handleEditPieceDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: {
      piece: { pieceType: string; isSparePiece: boolean; position: string }
      sourceSquare: string
      targetSquare: string | null
    }) => {
      if (!targetSquare) return false
      const boardPiece = fenCharToBoardPiece(piece.pieceType)
      if (!boardPiece) return false
      setEditPosition((prev) => {
        const next = { ...prev }
        delete next[sourceSquare]
        next[targetSquare] = boardPiece
        return next
      })
      return true
    },
    [],
  )

  // --- Play mode handlers ---
  const handlePlayPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: {
      piece: { pieceType: string; isSparePiece: boolean; position: string }
      sourceSquare: string
      targetSquare: string | null
    }) => {
      if (!targetSquare) return false
      const game = gameRef.current
      try {
        game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
        setGameVersion(v => v + 1)
        setSelectedSquare(null)
        notifyFen(game.fen())
        return true
      } catch {
        return false
      }
    },
    [notifyFen],
  )

  /** Core click-to-move logic — used by both onSquareClick and onPieceClick */
  const handlePlayClick = useCallback(
    (square: string, hasPieceOnSquare: boolean, pieceColor?: 'w' | 'b') => {
      const game = gameRef.current
      if (game.isGameOver()) return

      // If a square is selected and this square is a legal move target — execute move
      if (selectedSquare && selectedSquare !== square) {
        const isLegalTarget = legalMoves.some(m => m.to === square)
        if (isLegalTarget) {
          try {
            game.move({ from: selectedSquare, to: square, promotion: 'q' })
            setGameVersion(v => v + 1)
            setSelectedSquare(null)
            notifyFen(game.fen())
            return
          } catch { /* fall through */ }
        }
      }

      // Clicking same square — deselect
      if (selectedSquare === square) {
        setSelectedSquare(null)
        return
      }

      // Clicking a piece of the current turn's color — select it
      if (hasPieceOnSquare && pieceColor === game.turn()) {
        setSelectedSquare(square)
        return
      }

      // Clicking empty square or opponent piece with no selection — deselect
      setSelectedSquare(null)
    },
    [selectedSquare, legalMoves, notifyFen],
  )

  const handlePlaySquareClick = useCallback(
    ({ piece, square }: { piece: { pieceType: string } | null; square: string }) => {
      const pieceColor = piece ? (piece.pieceType[0] === 'w' ? 'w' : 'b') as 'w' | 'b' : undefined
      handlePlayClick(square, !!piece, pieceColor)
    },
    [handlePlayClick],
  )

  const handlePlayPieceClick = useCallback(
    ({ piece, square }: { isSparePiece: boolean; piece: { pieceType: string }; square: string | null }) => {
      if (!square) return
      // pieceType format: "wP", "bK" etc — first char is color
      const pieceColor = (piece.pieceType[0] === 'w' ? 'w' : 'b') as 'w' | 'b'
      handlePlayClick(square, true, pieceColor)
    },
    [handlePlayClick],
  )

  // --- Shared actions ---
  const handleFenChange = useCallback((newFen: string) => {
    // Load FEN and switch to play mode
    try {
      const game = new Chess(newFen)
      gameRef.current = game
      setGameVersion(v => v + 1)
      setMode('play')
      setSelectedPiece(null)
      notifyFen(newFen)
    } catch {
      // Invalid FEN for chess.js — stay in edit mode
      setEditPosition(fenToPosition(newFen))
      setEditSideToMove(fenSideToMove(newFen))
      setMode('edit')
    }
  }, [notifyFen])

  // Handle external FEN loading (e.g., from recent positions)
  useEffect(() => {
    if (externalFen) handleFenChange(externalFen)
  }, [externalFen, handleFenChange])

  const clearBoard = useCallback(() => {
    setEditPosition({})
    setEditSideToMove('w')
    setMode('edit')
    setSelectedPiece(null)
    gameRef.current = new Chess()
    setGameVersion(v => v + 1)
  }, [])

  const loadStarting = useCallback(() => {
    gameRef.current = new Chess()
    setGameVersion(v => v + 1)
    setMode('play')
    setSelectedPiece(null)
    setSelectedSquare(null)
    notifyFen(STARTING_FEN)
  }, [notifyFen])

  const switchToEdit = useCallback(() => {
    setEditPosition(fenToPosition(fen))
    setEditSideToMove(fenSideToMove(fen))
    setMode('edit')
    setSelectedPiece(null)
    setSelectedSquare(null)
  }, [fen])

  const switchToPlay = useCallback(() => {
    try {
      const game = new Chess(editFen)
      gameRef.current = game
      setGameVersion(v => v + 1)
      setMode('play')
      setSelectedPiece(null)
      setSelectedSquare(null)
      notifyFen(editFen)
    } catch {
      // Invalid position for play
    }
  }, [editFen, notifyFen])

  const handleUndo = useCallback(() => {
    const game = gameRef.current
    game.undo()
    setGameVersion(v => v + 1)
    setSelectedSquare(null)
    notifyFen(game.fen())
  }, [notifyFen])

  const hasPieces = mode === 'edit'
    ? Object.keys(editPosition).length > 0
    : fen !== '8/8/8/8/8/8/8/8 w KQkq - 0 1'

  const currentTurn = mode === 'play'
    ? (gameRef.current.turn() === 'w' ? 'White' : 'Black')
    : (editSideToMove === 'w' ? 'White' : 'Black')

  // Status line
  let statusText = ''
  if (mode === 'play') {
    if (gameRef.current.isCheckmate()) statusText = `Checkmate! ${gameRef.current.turn() === 'w' ? 'Black' : 'White'} wins`
    else if (gameRef.current.isStalemate()) statusText = 'Stalemate — Draw'
    else if (gameRef.current.isDraw()) statusText = 'Draw'
    else if (isCheck) statusText = `${currentTurn} is in check`
    else statusText = `${currentTurn} to move`
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle + status */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={switchToEdit}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              mode === 'edit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={switchToPlay}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              mode === 'play' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Play
          </button>
        </div>
        {mode === 'play' && statusText && (
          <span className={cn(
            'text-xs font-medium',
            isCheck ? 'text-destructive' : 'text-muted-foreground',
          )}>
            {statusText}
          </span>
        )}
      </div>

      {/* Board */}
      <div className="relative w-full max-w-[560px]">
        <Chessboard
          options={{
            id: 'board-editor',
            position: fen,
            onSquareClick: mode === 'edit' ? handleEditSquareClick : handlePlaySquareClick,
            onPieceClick: mode === 'play' ? handlePlayPieceClick : undefined,
            onSquareRightClick: mode === 'edit' ? handleEditSquareRightClick : (mode === 'play' ? () => setSelectedSquare(null) : undefined),
            onPieceDrop: mode === 'edit' ? handleEditPieceDrop : handlePlayPieceDrop,
            boardStyle: {
              borderRadius: '8px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            },
            darkSquareStyle: { backgroundColor: '#779952' },
            lightSquareStyle: { backgroundColor: '#edeed1' },
            squareStyles: mode === 'play' ? playSquareStyles : undefined,
            arrows: externalArrows ?? [],
            animationDurationInMs: 150,
          }}
        />
        {mode === 'edit' && selectedPiece && (
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-2" />
        )}
      </div>

      {/* Edit mode: Piece Palette */}
      {mode === 'edit' && (
        <PiecePalette
          selectedPiece={selectedPiece}
          onSelectPiece={setSelectedPiece}
        />
      )}

      {/* Play mode: Move History + Undo */}
      {mode === 'play' && moveHistory.length > 0 && (
        <MoveHistory moves={moveHistory} onUndo={handleUndo} />
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={loadStarting}>
          Starting Position
        </Button>
        <Button variant="outline" size="sm" onClick={clearBoard}>
          Clear Board
        </Button>

        {mode === 'play' && moveHistory.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleUndo}>
            Undo
          </Button>
        )}

        {mode === 'edit' && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">To move:</span>
            <button
              type="button"
              onClick={() => setEditSideToMove(s => s === 'w' ? 'b' : 'w')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border text-lg transition-colors',
                editSideToMove === 'w'
                  ? 'border-border bg-white text-black'
                  : 'border-border bg-zinc-800 text-white',
              )}
            >
              {editSideToMove === 'w' ? '\u2654' : '\u265A'}
            </button>
          </div>
        )}
      </div>

      {/* FEN */}
      <FenInput fen={fen} onFenChange={handleFenChange} />

      {/* Analyze Button */}
      {onAnalyze && (
        <Button
          size="lg"
          className="w-full"
          disabled={!hasPieces || isAnalyzing}
          onClick={() => onAnalyze(fen)}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Position'}
        </Button>
      )}
    </div>
  )
}
