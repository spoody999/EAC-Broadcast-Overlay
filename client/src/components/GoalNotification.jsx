import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

const DISPLAY_DURATION_MS = 5000

export default function GoalNotification() {
  const lastGoal = useGameStore((s) => s.lastGoal)
  const clearLastGoal = useGameStore((s) => s.clearLastGoal)
  const seriesState = useGameStore((s) => s.seriesState)

  const [visible, setVisible] = useState(false)
  const [goal, setGoal] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!lastGoal) return

    // Capture the goal data and show notification
    setGoal(lastGoal)
    setVisible(true)
    clearLastGoal()

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(false)
    }, DISPLAY_DURATION_MS)

    return () => clearTimeout(timerRef.current)
  }, [lastGoal]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!goal) return null

  const scorerTeamNum = goal.Scorer?.TeamNum ?? 0
  const isBlue = scorerTeamNum === 0
  const teamName = seriesState.teams[scorerTeamNum]?.name || (isBlue ? 'Blue' : 'Orange')
  const teamColor = isBlue ? '#3B82F6' : '#F97316'
  const assister = goal.Assister

  return (
    <div
      className={`flex flex-col items-center transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
      }`}
    >
      <div
        className="rounded-2xl px-10 py-4 text-center shadow-2xl backdrop-blur-sm border border-white/20"
        style={{
          background: `linear-gradient(135deg, ${teamColor}CC, ${teamColor}88)`,
        }}
      >
        {/* GOAL header */}
        <div className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1">
          Goal — {teamName}
        </div>

        {/* Scorer name */}
        <div className="text-white font-black text-3xl drop-shadow-lg">
          {goal.Scorer?.Name ?? 'Unknown'}
        </div>

        {/* Assist line */}
        {assister && (
          <div className="text-white/70 text-sm mt-1">
            Assist: <span className="font-semibold">{assister.Name}</span>
          </div>
        )}

        {/* Goal speed */}
        {goal.GoalSpeed != null && (
          <div className="text-white/50 text-xs mt-1">
            {Math.round(goal.GoalSpeed).toLocaleString()} UU/s
          </div>
        )}
      </div>
    </div>
  )
}
