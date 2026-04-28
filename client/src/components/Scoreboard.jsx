import { useGameStore } from '../store/useGameStore'

function formatTime(seconds) {
  if (seconds == null) return '5:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function TeamPanel({ team, seriesTeam, side }) {
  const isLeft = side === 'left'

  return (
    <div
      className={`flex items-center gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Logo slot — always the same fixed size so both sides stay symmetrical */}
      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
        {seriesTeam?.logoUrl && (
          <img
            src={seriesTeam.logoUrl}
            alt={seriesTeam.name}
            className="w-14 h-14 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}
      </div>

      {/* Name */}
      <span className="text-white font-bold text-2xl uppercase tracking-wider drop-shadow-lg">
        {seriesTeam?.name || team.Name}
      </span>

      {/* Score */}
      <span
        className="text-white font-black text-5xl tabular-nums drop-shadow-lg"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
      >
        {team.Score}
      </span>
    </div>
  )
}

export default function Scoreboard({ dimmed }) {
  const gameState = useGameStore((s) => s.gameState)
  const seriesState = useGameStore((s) => s.seriesState)
  const rlConnected = useGameStore((s) => s.rlConnected)

  const game = gameState.game
  const teams = game?.Teams ?? []
  const blueTeam = teams.find((t) => t.TeamNum === 0) ?? { Name: 'Blue', Score: 0 }
  const orangeTeam = teams.find((t) => t.TeamNum === 1) ?? { Name: 'Orange', Score: 0 }

  const timeSeconds = game?.TimeSeconds ?? null
  const isOvertime = game?.bOvertime ?? false

  return (
    <div
      className={`relative flex items-center px-8 py-2 transition-opacity duration-300 ${dimmed ? 'opacity-50' : 'opacity-100'}`}
      style={{ minWidth: 700 }}
    >
      {/* Blue Team (left) */}
      <div
        className="flex-1 flex justify-start pr-28"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,255,0.4))' }}
      >
        <TeamPanel team={blueTeam} seriesTeam={seriesState.teams[0]} side="left" />
      </div>

      {/* Center clock — absolutely centred so team panel widths never affect it */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="bg-gray-900 rounded-xl px-8 py-3 border border-gray-700">
          <div
            className={`font-black text-5xl tabular-nums tracking-tight ${
              isOvertime ? 'text-yellow-400' : 'text-white'
            }`}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
          >
            {isOvertime ? 'OT' : formatTime(timeSeconds)}
          </div>
          {!rlConnected && (
            <div className="text-gray-500 text-xs text-center mt-0.5">Waiting…</div>
          )}
        </div>
      </div>

      {/* Orange Team (right) */}
      <div
        className="flex-1 flex justify-end pl-28"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(255,128,0,0.4))' }}
      >
        <TeamPanel team={orangeTeam} seriesTeam={seriesState.teams[1]} side="right" />
      </div>
    </div>
  )
}
