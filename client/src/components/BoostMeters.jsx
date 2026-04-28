import { useGameStore } from '../store/useGameStore'

// Unreal Units/sec → approx km/h (1 UU/s ≈ 0.036 km/h in RL)
// RL typical max speed ~2300 UU/s ≈ ~83 km/h displayed as ~2300 km/h in-game
// The game displays speed in km/h where 2300 UU/s = ~208 km/h (roughly UU/s ÷ 11 = km/h)
// We'll just show UU/s labelled as "speed" to avoid conversion guessing.

function BoostBar({ boost, isBoosting, isDemolished, isSupersonic, teamNum }) {
  const fillPct = Math.max(0, Math.min(100, boost ?? 0))
  const isBlue = teamNum === 0

  let barColor = isBlue
    ? 'bg-blue-400'
    : 'bg-orange-400'

  if (isSupersonic) barColor = isBlue ? 'bg-cyan-300' : 'bg-yellow-300'
  if (isDemolished) barColor = 'bg-red-600'

  return (
    <div className="relative w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-100 ${barColor} ${
          isBoosting && !isDemolished ? 'animate-boost-pulse' : ''
        }`}
        style={{ width: `${fillPct}%` }}
      />
    </div>
  )
}

function PlayerBoostCard({ player, teamNum }) {
  const isBlue = teamNum === 0
  const isDemolished = player.bDemolished ?? false
  const hasCar = player.bHasCar ?? true
  const boost = player.Boost ?? 0
  const isBoosting = player.bBoosting ?? false
  const isSupersonic = player.bSupersonic ?? false

  const borderColor = isBlue ? 'border-blue-500/60' : 'border-orange-500/60'
  const nameColor = isDemolished ? 'text-red-400' : 'text-white'

  return (
    <div
      className={`bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border ${borderColor} w-36`}
    >
      <div className={`text-xs font-semibold truncate mb-1.5 ${nameColor}`}>
        {isDemolished ? '💥 ' : ''}{player.Name}
      </div>
      {hasCar ? (
        <>
          <BoostBar
            boost={boost}
            isBoosting={isBoosting}
            isDemolished={isDemolished}
            isSupersonic={isSupersonic}
            teamNum={teamNum}
          />
          <div className="flex justify-between mt-1">
            <span className="text-white/50 text-xs">Boost</span>
            <span className={`text-xs font-bold tabular-nums ${
              isSupersonic ? (isBlue ? 'text-cyan-300' : 'text-yellow-300') : 'text-white'
            }`}>
              {isDemolished ? '--' : `${boost}`}
            </span>
          </div>
        </>
      ) : (
        <div className="text-white/30 text-xs text-center py-1">No car</div>
      )}
    </div>
  )
}

export default function BoostMeters({ dimmed }) {
  const players = useGameStore((s) => s.gameState.players)

  const bluePlayers = players.filter((p) => p.TeamNum === 0)
  const orangePlayers = players.filter((p) => p.TeamNum === 1)

  if (players.length === 0) return null

  return (
    <div
      className={`flex justify-between px-6 transition-opacity duration-300 ${dimmed ? 'opacity-30' : 'opacity-100'}`}
    >
      {/* Blue team — left side */}
      <div className="flex gap-2">
        {bluePlayers.map((p) => (
          <PlayerBoostCard key={p.PrimaryId || p.Name} player={p} teamNum={0} />
        ))}
      </div>

      {/* Orange team — right side */}
      <div className="flex gap-2">
        {orangePlayers.map((p) => (
          <PlayerBoostCard key={p.PrimaryId || p.Name} player={p} teamNum={1} />
        ))}
      </div>
    </div>
  )
}
