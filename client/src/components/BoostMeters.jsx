import { memo, useMemo } from 'react'
import { useGameStore } from '../store/useGameStore'

const BoostBar = memo(function BoostBar({ boost, isBoosting, isDemolished, isSupersonic, teamNum }) {
  const fillPct = Math.max(0, Math.min(100, boost ?? 0))
  const isBlue = teamNum === 0

  let barColor = isBlue ? 'bg-blue-400' : 'bg-orange-400'
  if (isSupersonic) barColor = isBlue ? 'bg-cyan-300' : 'bg-yellow-300'
  if (isDemolished) barColor = 'bg-red-600'

  return (
    <div className="relative w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-[width] duration-100 ${barColor} ${
          isBoosting && !isDemolished ? 'animate-boost-pulse' : ''
        }`}
        style={{ width: `${fillPct}%` }}
      />
    </div>
  )
})

const PlayerBoostCard = memo(function PlayerBoostCard({
  name, boost, isBoosting, isDemolished, isSupersonic, hasCar, teamNum,
}) {
  const isBlue = teamNum === 0
  const borderColor = isBlue ? 'border-blue-500/60' : 'border-orange-500/60'
  const nameColor = isDemolished ? 'text-red-400' : 'text-white'

  return (
    <div className={`bg-gray-900 rounded-lg px-3 py-2 border ${borderColor} w-36`}>
      <div className={`text-xs font-semibold truncate mb-1.5 ${nameColor}`}>
        {isDemolished ? '💥 ' : ''}{name}
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
            <span className="text-gray-400 text-xs">Boost</span>
            <span className={`text-xs font-bold tabular-nums ${
              isSupersonic ? (isBlue ? 'text-cyan-300' : 'text-yellow-300') : 'text-white'
            }`}>
              {isDemolished ? '--' : `${boost}`}
            </span>
          </div>
        </>
      ) : (
        <div className="text-gray-500 text-xs text-center py-1">No car</div>
      )}
    </div>
  )
})

export default function BoostMeters({ dimmed }) {
  const players = useGameStore((s) => s.gameState.players)

  const { bluePlayers, orangePlayers } = useMemo(() => ({
    bluePlayers: players.filter((p) => p.TeamNum === 0),
    orangePlayers: players.filter((p) => p.TeamNum === 1),
  }), [players])

  if (players.length === 0) return null

  return (
    <div
      className={`flex justify-between px-6 transition-opacity duration-300 ${dimmed ? 'opacity-30' : 'opacity-100'}`}
    >
      {/* Blue team — left side */}
      <div className="flex gap-2">
        {bluePlayers.map((p) => (
          <PlayerBoostCard
            key={p.PrimaryId || p.Name}
            name={p.Name}
            boost={p.Boost ?? 0}
            isBoosting={p.bBoosting ?? false}
            isDemolished={p.bDemolished ?? false}
            isSupersonic={p.bSupersonic ?? false}
            hasCar={p.bHasCar ?? true}
            teamNum={0}
          />
        ))}
      </div>

      {/* Orange team — right side */}
      <div className="flex gap-2">
        {orangePlayers.map((p) => (
          <PlayerBoostCard
            key={p.PrimaryId || p.Name}
            name={p.Name}
            boost={p.Boost ?? 0}
            isBoosting={p.bBoosting ?? false}
            isDemolished={p.bDemolished ?? false}
            isSupersonic={p.bSupersonic ?? false}
            hasCar={p.bHasCar ?? true}
            teamNum={1}
          />
        ))}
      </div>
    </div>
  )
}
