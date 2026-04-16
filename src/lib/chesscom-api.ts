import { createServerFn } from '@tanstack/react-start'
import type { ChessComGame } from './chesscom-types'

export const fetchPlayerGamesFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { username: string }) => {
    const username = data.username?.trim().toLowerCase()
    if (!username || username.length < 2 || username.length > 25) {
      throw new Error('Invalid username')
    }
    return { username }
  })
  .handler(async ({ data }) => {
    const { username } = data

    // Fetch archives list
    const archivesRes = await fetch(
      `https://api.chess.com/pub/player/${username}/games/archives`,
      { headers: { 'User-Agent': 'ChessMe/1.0' } },
    )
    if (!archivesRes.ok) {
      if (archivesRes.status === 404) throw new Error('Player not found')
      throw new Error(`Chess.com API error: ${archivesRes.status}`)
    }
    const { archives } = (await archivesRes.json()) as { archives: string[] }

    if (!archives || archives.length === 0) {
      throw new Error('No games found for this player')
    }

    // Fetch latest month
    const latestArchiveUrl = archives[archives.length - 1]
    const gamesRes = await fetch(latestArchiveUrl, {
      headers: { 'User-Agent': 'ChessMe/1.0' },
    })
    if (!gamesRes.ok) {
      throw new Error(`Failed to fetch games: ${gamesRes.status}`)
    }
    const { games } = (await gamesRes.json()) as { games: ChessComGame[] }

    // Return most recent 20 games, newest first
    return games
      .filter((g) => g.rules === 'chess')
      .slice(-20)
      .reverse()
  })
