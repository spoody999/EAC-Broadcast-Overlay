import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../store/useGameStore'

function formatTime(seconds) {
  if (seconds == null) return '5:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const TeamPanel = memo(function TeamPanel({ score, rlName, configuredName, logoUrl, side }) {
  const isLeft = side === 'left'
  const display = configuredName || rlName

  return (
    <div
      className={`flex items-center gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Logo slot — always the same fixed size so both sides stay symmetrical */}
      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={display}
            className="w-14 h-14 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}
      </div>

      {/* Name */}
      <span className="text-white font-bold text-2xl uppercase tracking-wider drop-shadow-lg">
        {display}
      </span>

      {/* Score */}
      <span
        className="text-white font-black text-5xl tabular-nums drop-shadow-lg"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
      >
        {score}
      </span>
    </div>
  )
})

export default function Scoreboard({ dimmed }) {
  // Granular selectors collapsed into one shallow-compared object so the
  // component re-renders only when one of these primitives actually changes
  const view = useGameStore(useShallow((s) => {
    const teams = s.gameState.game?.Teams
    const blue = teams?.find((t) => t.TeamNum === 0)
    const orange = teams?.find((t) => t.TeamNum === 1)
    return {
      blueScore: blue?.Score ?? 0,
      orangeScore: orange?.Score ?? 0,
      blueRlName: blue?.Name ?? 'Blue',
      orangeRlName: orange?.Name ?? 'Orange',
      timeSeconds: s.gameState.game?.TimeSeconds ?? null,
      isOvertime: s.gameState.game?.bOvertime ?? false,
      blueConfiguredName: s.seriesState.teams[0]?.name ?? '',
      orangeConfiguredName: s.seriesState.teams[1]?.name ?? '',
      blueLogoUrl: s.seriesState.teams[0]?.logoUrl ?? '',
      orangeLogoUrl: s.seriesState.teams[1]?.logoUrl ?? '',
      rlConnected: s.rlConnected,
    }
  }))

  return (
    <div
      className={`items-center px-8 py-2 transition-opacity duration-300 ${dimmed ? 'opacity-50' : 'opacity-100'}`}
      style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', minWidth: 700 }}
    >
      {/* Blue Team (left) — right-aligned toward clock */}
      <div
        className="flex justify-end pr-5"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,255,0.4))' }}
      >
        <TeamPanel
          score={view.blueScore}
          rlName={view.blueRlName}
          configuredName={view.blueConfiguredName}
          logoUrl={view.blueLogoUrl}
          side="left"
        />
      </div>

      {/* Center clock — natural flow in auto column, always centered */}
      <div className="flex flex-col items-center">
        <div className="bg-gray-900 rounded-xl px-8 py-3 border border-gray-700">
          <div
            className={`font-black text-5xl tabular-nums tracking-tight ${
              view.isOvertime ? 'text-yellow-400' : 'text-white'
            }`}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
          >
            {view.isOvertime ? 'OT' : formatTime(view.timeSeconds)}
          </div>
          {!view.rlConnected && (
            <div className="text-gray-500 text-xs text-center mt-0.5">Waiting…</div>
          )}
        </div>
      </div>

      {/* Orange Team (right) — left-aligned toward clock */}
      <div
        className="flex justify-start pl-5"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(255,128,0,0.4))' }}
      >
        <TeamPanel
          score={view.orangeScore}
          rlName={view.orangeRlName}
          configuredName={view.orangeConfiguredName}
          logoUrl={view.orangeLogoUrl}
          side="right"
        />
      </div>
    </div>
  )
}
