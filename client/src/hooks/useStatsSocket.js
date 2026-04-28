import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

const WS_URL = '/ws'
const RECONNECT_DELAY_MS = 3000

export function useStatsSocket() {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const unmounted = useRef(false)

  const {
    setRelayConnected,
    setRLConnected,
    applyInit,
    applyUpdateState,
    applyGoalScored,
    applySeriesUpdated,
    resetGameState,
  } = useGameStore()

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
        setRelayConnected(true)
      })

      ws.addEventListener('message', (e) => {
        let msg
        try {
          msg = JSON.parse(e.data)
        } catch {
          return
        }

        const { Event, Data } = msg

        switch (Event) {
          case '_init':
            applyInit(Data)
            break
          case '_rlConnected':
            setRLConnected(true)
            break
          case '_rlDisconnected':
            setRLConnected(false)
            resetGameState()
            break
          case '_seriesUpdated':
            applySeriesUpdated(Data)
            break
          case 'UpdateState':
            applyUpdateState(Data)
            break
          case 'GoalScored':
            applyGoalScored(Data)
            break
          default:
            // Other events (BallHit, StatfeedEvent, etc.) are available
            // for future use; ignored for now.
            break
        }
      })

      ws.addEventListener('close', () => {
        setRelayConnected(false)
        setRLConnected(false)
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
