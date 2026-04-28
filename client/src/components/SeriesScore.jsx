import { useGameStore } from '../store/useGameStore'

function WinPips({ wins, maxWins, teamNum }) {
  const isBlue = teamNum === 0
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: maxWins }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
            i < wins
              ? isBlue
                ? 'bg-blue-400 border-blue-300'
                : 'bg-orange-400 border-orange-300'
              : 'bg-transparent border-gray-500'
          }`}
        />
      ))}
    </div>
  )
}

export default function SeriesScore() {
  const seriesState = useGameStore((s) => s.seriesState)
  const { teams, format } = seriesState

  // BO3 → first to 2, BO5 → first to 3, BO7 → first to 4
  const winsNeeded = { BO3: 2, BO5: 3, BO7: 4 }[format] ?? 3
  const maxPips = winsNeeded

  const blue = teams[0]
  const orange = teams[1]

  return (
    <div className="flex items-center justify-center gap-6 py-1">
      {/* Blue series wins */}
      <div className="flex flex-col items-center gap-1">
        <WinPips wins={blue.seriesWins} maxWins={maxPips} teamNum={0} />
        <span className="text-blue-300 text-sm font-medium tabular-nums">
          {blue.seriesWins}W
        </span>
      </div>

      {/* Format label */}
      <div className="text-gray-400 text-sm font-bold uppercase tracking-widest">
        {format}
      </div>

      {/* Orange series wins */}
      <div className="flex flex-col items-center gap-1">
        <WinPips wins={orange.seriesWins} maxWins={maxPips} teamNum={1} />
        <span className="text-orange-300 text-sm font-medium tabular-nums">
          {orange.seriesWins}W
        </span>
      </div>
    </div>
  )
}
