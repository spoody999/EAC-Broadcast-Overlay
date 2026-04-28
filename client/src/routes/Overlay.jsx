import { useGameStore } from '../store/useGameStore'
import Scoreboard from '../components/Scoreboard'
import BoostMeters from '../components/BoostMeters'
import GoalNotification from '../components/GoalNotification'
import SeriesScore from '../components/SeriesScore'

export default function Overlay() {
  const gameState = useGameStore((s) => s.gameState)
  const rlConnected = useGameStore((s) => s.rlConnected)

  const isReplay = gameState.game?.bReplay ?? false
  const hasGame = rlConnected && gameState.game != null

  return (
    // Fixed 1920×1080 canvas — OBS Browser Source will render at this size
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ width: 1920, height: 1080, background: 'transparent' }}
    >
      {/* ── Top bar: Series score + Scoreboard ── */}
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-4 gap-1">
        <SeriesScore />
        <Scoreboard dimmed={isReplay} />
      </div>

      {/* ── Center: Goal notification ── */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 160 }}>
        <GoalNotification />
      </div>

      {/* ── Bottom: Boost meters ── */}
      {hasGame && (
        <div className="absolute bottom-6 left-0 right-0">
          <BoostMeters dimmed={isReplay} />
        </div>
      )}

      {/* ── Idle state ── */}
      {!rlConnected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="bg-black/50 rounded-full px-4 py-1.5 text-white/30 text-xs font-medium">
            Waiting for Rocket League…
          </div>
        </div>
      )}
    </div>
  )
}
