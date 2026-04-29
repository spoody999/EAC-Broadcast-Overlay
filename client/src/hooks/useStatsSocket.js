import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

const WS_URL = '/ws'
const RECONNECT_DELAY_MS = 3000

export function useStatsSocket() {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const unmounted = useRef(false)

  useEffect(() => {
    unmounted.current = false

    function connect() {
      if (unmounted.current) return

      // Build absolute ws:// URL from the current page origin
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const url = `${protocol}//${host}${WS_URL}`

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.addEventListener('open', () => {
        useGameStore.getState().setRelayConnected(true)
      })

      ws.addEventListener('message', (e) => {
        let msg
        try {
          msg = JSON.parse(e.data)
        } catch {
          return
        }

        const { Event, Data } = msg
        const store = useGameStore.getState()

        switch (Event) {
          case '_init':
            store.applyInit(Data)
            break
          case '_rlConnected':
            store.setRLConnected(true)
            break
          case '_rlDisconnected':
            store.setRLConnected(false)
            store.setIsReplay(false)
            store.resetGameState()
            break
          case '_seriesUpdated':
            store.applySeriesUpdated(Data)
            break
          case 'UpdateState':
            store.applyUpdateState(Data)
            break
          case 'GoalScored':
            // Fallback: if RL ever does send this event, use it directly
            store.applyGoalScored(Data)
            break
          case 'CountdownBegin':
          case 'RoundStarted':
            // Safety reset for any stuck replay state
            store.setIsReplay(false)
            break
          case '_postMatchShow': {
            // Admin triggered show — snapshot current game state
            const gs = store.gameState
            if (gs.game) {
              store.setPostMatchStats({ players: gs.players, game: gs.game })
            }
            break
          }
          case '_postMatchHide':
            store.clearPostMatchStats()
            break
          default:
            // Other events (BallHit, StatfeedEvent, etc.) are available
            // for future use; ignored for now.
            break
        }
      })

      ws.addEventListener('close', () => {
        useGameStore.getState().setRelayConnected(false)
        useGameStore.getState().setRLConnected(false)
        if (!unmounted.current) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      })

      ws.addEventListener('error', () => {
        // 'close' will fire after error and trigger reconnect
      })
    }

    connect()

    return () => {
      unmounted.current = true
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
