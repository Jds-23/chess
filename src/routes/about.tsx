import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Chess Position Analysis
        </h1>
        <div className="max-w-3xl space-y-4 text-base leading-8 text-[var(--sea-ink-soft)]">
          <p>
            Analyze any chess position with Stockfish 18, one of the strongest
            chess engines in the world. Set up a position using the board editor
            or paste a FEN string, then get instant engine evaluation with
            multiple principal variations.
          </p>
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Features</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Interactive board editor with drag-and-drop and click-to-move</li>
            <li>Stockfish 18 WASM engine analysis (depth 18, 3 PV lines)</li>
            <li>Evaluation bar and best move arrows</li>
            <li>Legal move highlighting (chess.com style)</li>
            <li>Move history with undo</li>
            <li>FEN import/export</li>
            <li>Recent analysis history (saved locally)</li>
            <li>Dark mode support</li>
          </ul>
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Tech Stack</h2>
          <p>
            Built with React 19, TanStack Start, Tailwind CSS, react-chessboard,
            chess.js, and Stockfish WASM. Engine runs server-side in an isolated
            worker process.
          </p>
        </div>
      </section>
    </main>
  )
}
