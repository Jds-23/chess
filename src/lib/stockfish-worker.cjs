/**
 * Stockfish worker process.
 * Runs in a separate Node.js process to avoid crashing the Vite dev server.
 * Communicates via IPC messages.
 */

const initEngine = require('stockfish')

let engine = null

function parseInfoLine(line) {
  const result = {}
  const depthMatch = line.match(/\bdepth (\d+)/)
  if (depthMatch) result.depth = parseInt(depthMatch[1])
  const multipvMatch = line.match(/\bmultipv (\d+)/)
  if (multipvMatch) result.multipv = parseInt(multipvMatch[1])
  const cpMatch = line.match(/\bscore cp (-?\d+)/)
  if (cpMatch) result.eval = parseInt(cpMatch[1])
  const mateMatch = line.match(/\bscore mate (-?\d+)/)
  if (mateMatch) result.mate = parseInt(mateMatch[1])
  const pvMatch = line.match(/\bpv (.+)$/)
  if (pvMatch) result.moves = pvMatch[1].trim().split(/\s+/)
  return result
}

async function init() {
  engine = await initEngine('lite-single')
  process.send({ type: 'ready' })
}

function analyze(msg) {
  const { fen, depth, multiPv, requestId } = msg
  const lines = new Map()
  let maxDepth = 0

  const timeout = setTimeout(() => {
    process.send({ type: 'error', requestId, error: 'Analysis timed out' })
  }, 30000)

  engine.listener = (line) => {
    if (line.startsWith('info depth')) {
      const parsed = parseInfoLine(line)
      if (parsed.depth && parsed.moves?.length && parsed.multipv) {
        const pvNum = parsed.multipv
        const evalScore = parsed.mate != null
          ? (parsed.mate > 0 ? 100000 - parsed.mate : -100000 - parsed.mate)
          : (parsed.eval ?? 0)

        const existing = lines.get(pvNum)
        if (!existing || parsed.depth >= existing.depth) {
          lines.set(pvNum, {
            eval: evalScore,
            moves: parsed.moves,
            depth: parsed.depth,
            multipv: pvNum,
          })
        }
        if (parsed.depth > maxDepth) maxDepth = parsed.depth
      }
    }

    if (line.startsWith('bestmove')) {
      clearTimeout(timeout)
      const bestMove = line.split(/\s+/)[1] || ''
      const sortedLines = Array.from(lines.values()).sort((a, b) => a.multipv - b.multipv)
      const topEval = sortedLines[0]?.eval ?? 0
      const hasMate = sortedLines.some(l => Math.abs(l.eval) >= 99000)

      process.send({
        type: 'result',
        requestId,
        result: {
          fen,
          eval: topEval,
          bestMove,
          lines: sortedLines,
          depth: maxDepth,
          mate: hasMate ? (topEval > 0 ? 100000 - topEval : -(100000 + topEval)) : null,
        }
      })
    }
  }

  engine.sendCommand('ucinewgame')
  engine.sendCommand(`setoption name MultiPV value ${multiPv}`)
  engine.sendCommand(`position fen ${fen}`)
  engine.sendCommand(`go depth ${depth}`)
}

process.on('message', (msg) => {
  if (msg.type === 'analyze') analyze(msg)
})

init().catch(err => {
  process.send({ type: 'error', error: err.message })
  process.exit(1)
})
