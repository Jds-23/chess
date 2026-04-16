import { useState, useEffect, useCallback } from 'react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { isValidFen } from '#/lib/chess-types'

interface FenInputProps {
  fen: string
  onFenChange: (fen: string) => void
}

export default function FenInput({ fen, onFenChange }: FenInputProps) {
  const [draft, setDraft] = useState(fen)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    setDraft(fen)
    setIsValid(true)
  }, [fen])

  const applyFen = useCallback(() => {
    const trimmed = draft.trim()
    if (isValidFen(trimmed)) {
      onFenChange(trimmed)
      setIsValid(true)
    } else {
      setIsValid(false)
    }
  }, [draft, onFenChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') applyFen()
    },
    [applyFen],
  )

  const copyFen = useCallback(() => {
    navigator.clipboard.writeText(fen)
  }, [fen])

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="fen-input" className="text-xs font-medium text-muted-foreground">
        FEN
      </Label>
      <div className="flex gap-1.5">
        <Input
          id="fen-input"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setIsValid(true) }}
          onBlur={applyFen}
          onKeyDown={handleKeyDown}
          placeholder="Paste FEN here..."
          className={!isValid ? 'border-destructive' : ''}
          spellCheck={false}
          autoComplete="off"
        />
        <Button variant="outline" size="sm" onClick={applyFen} className="shrink-0">
          Load
        </Button>
        <Button variant="ghost" size="sm" onClick={copyFen} className="shrink-0">
          Copy
        </Button>
      </div>
      {!isValid && (
        <p className="text-xs text-destructive">Invalid FEN string</p>
      )}
    </div>
  )
}
