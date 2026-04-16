/**
 * Server-side Stockfish engine manager.
 * Runs Stockfish WASM in a child process to avoid crashing Vite dev server.
 */

import { fork, type ChildProcess } from 'node:child_process'
import { join } from 'node:path'
import { accessSync } from 'node:fs'

export type { AnalysisLine, AnalysisResult } from './analysis-types'
import type { AnalysisResult } from './analysis-types'

let worker: ChildProcess | null = null
let workerReady = false
let readyPromise: Promise<void> | null = null
let requestCounter = 0
const pendingRequests = new Map<number, {
  resolve: (result: AnalysisResult) => void
  reject: (error: Error) => void
}>()

function getWorkerPath(): string {
  const cwd = process.cwd()
  const candidates = [
    join(cwd, 'src', 'lib', 'stockfish-worker.cjs'),
    join(cwd, 'dist', 'server', 'stockfish-worker.cjs'),
  ]
  for (const candidate of candidates) {
    try {
      accessSync(candidate)
      return candidate
    } catch { /* continue */ }
  }
  return candidates[0]
}

function ensureWorker(): Promise<void> {
  if (workerReady && worker && worker.connected) return Promise.resolve()

  if (readyPromise) return readyPromise

  readyPromise = new Promise<void>((resolve, reject) => {
    const workerPath = getWorkerPath()
    worker = fork(workerPath, [], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    worker.on('message', (msg: { type: string; requestId?: number; result?: AnalysisResult; error?: string }) => {
      if (msg.type === 'ready') {
        workerReady = true
        resolve()
      } else if (msg.type === 'result' && msg.requestId != null) {
        const pending = pendingRequests.get(msg.requestId)
        if (pending) {
          pendingRequests.delete(msg.requestId)
          pending.resolve(msg.result!)
        }
      } else if (msg.type === 'error') {
        if (msg.requestId != null) {
          const pending = pendingRequests.get(msg.requestId)
          if (pending) {
            pendingRequests.delete(msg.requestId)
            pending.reject(new Error(msg.error ?? 'Unknown error'))
          }
        } else {
          reject(new Error(msg.error ?? 'Worker init failed'))
        }
      }
    })

    worker.on('exit', (code) => {
      workerReady = false
      readyPromise = null
      worker = null
      // Reject all pending requests
      for (const [id, pending] of pendingRequests) {
        pending.reject(new Error(`Worker exited with code ${code}`))
        pendingRequests.delete(id)
      }
    })

    worker.on('error', (err) => {
      reject(err)
    })
  })

  return readyPromise
}

export async function analyzePosition(
  fen: string,
  depth = 18,
  multiPv = 3,
): Promise<AnalysisResult> {
  await ensureWorker()

  const requestId = requestCounter++

  return new Promise<AnalysisResult>((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject })

    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Analysis timed out'))
    }, 30_000)

    const originalResolve = resolve
    pendingRequests.set(requestId, {
      resolve: (result) => { clearTimeout(timeout); originalResolve(result) },
      reject: (err) => { clearTimeout(timeout); reject(err) },
    })

    worker!.send({
      type: 'analyze',
      fen,
      depth,
      multiPv,
      requestId,
    })
  })
}
