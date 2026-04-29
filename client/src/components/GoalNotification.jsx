import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

const DURATION_MS = 5000

const STYLES = `
  @keyframes gFlash {
    0%   { opacity: 0; transform: scaleX(0.7); }
    12%  { opacity: 1; transform: scaleX(1); }
    78%  { opacity: 1; transform: scaleX(1); }
    100% { opacity: 0; transform: scaleX(1); }
  }
  @keyframes gStamp {
    0%   { opacity: 0; transform: scale(2.6); }
    18%  { opacity: 1; transform: scale(0.9); }
    28%  { transform: scale(1.05); }
    38%  { transform: scale(1); }
    78%  { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1); }
  }
  @keyframes gSlideUp {
    0%   { opacity: 0; transform: translateY(20px); }
    30%  { opacity: 1; transform: translateY(0); }
    78%  { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(0); }
  }
  @keyframes gDrain {
    from { width: 100%; }
    to   { width: 0%; }
  }
`

export default function GoalNotification() {
  const lastGoal = useGameStore((s) => s.lastGoal)
  const clearLastGoal = useGameStore((s) => s.clearLastGoal)
  const seriesState = useGameStore((s) => s.seriesState)

  const [goal, setGoal] = useState(null)
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!lastGoal) return
    setGoal(lastGoal)
    setAnimKey((k) => k + 1)
    clearLastGoal()
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setGoal(null), DURATION_MS)
    return () => clearTimeout(timerRef.current)
  }, [lastGoal]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!goal) return null

  const scorerTeamNum = goal.Scorer?.TeamNum ?? 0
  const isBlue = scorerTeamNum === 0
  const teamName = seriesState.teams[scorerTeamNum]?.name || (isBlue ? 'Blue' : 'Orange')
  const teamColor = isBlue ? '#3B82F6' : '#F97316'
  const teamColorDark = isBlue ? '#1D4ED8' : '#C2410C'
  const anim = (name) => `${name} ${DURATION_MS}ms ease forwards`

  return (
    <div key={animKey} style={{ minWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{STYLES}</style>

      {/* Card */}
      <div style={{
        animation: anim('gFlash'),
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        background: `linear-gradient(160deg, ${teamColor}, ${teamColorDark})`,
      }}>
        {/* Top accent */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.4)' }} />

        <div style={{ padding: '20px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>

          {/* GOAL! stamp */}
          <div style={{
            animation: anim('gStamp'),
            fontFamily: 'inherit',
            fontWeight: 900,
            fontSize: 80,
            lineHeight: 1,
            color: '#fff',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            GOAL!
          </div>

          {/* Scorer details */}
          <div style={{
            animation: anim('gSlideUp'),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {teamName}
            </div>
            <div style={{ color: '#fff', fontSize: 38, fontWeight: 900, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              {goal.Scorer?.Name ?? 'Unknown'}
            </div>
            {goal.Assister && (
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                Assist: <span style={{ fontWeight: 700 }}>{goal.Assister.Name}</span>
              </div>
            )}
            {goal.GoalSpeed != null && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {Math.round(goal.GoalSpeed).toLocaleString()} km/h
              </div>
            )}
          </div>

        </div>

        {/* Drain bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.2)' }}>
          <div style={{
            height: '100%',
            background: 'rgba(255,255,255,0.65)',
            animation: anim('gDrain'),
          }} />
        </div>
      </div>
    </div>
  )
}
