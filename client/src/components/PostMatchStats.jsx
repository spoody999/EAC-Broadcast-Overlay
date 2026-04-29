import { useGameStore } from '../store/useGameStore'

const STAT_COLS = [
  { key: 'Score',   label: 'PTS' },
  { key: 'Goals',   label: 'G' },
  { key: 'Assists', label: 'A' },
  { key: 'Saves',   label: 'Sv' },
  { key: 'Shots',   label: 'Sh' },
  { key: 'Demos',   label: 'D' },
]

function TeamTable({ players, teamName, teamScore, accentColor, accentDark, isWinner }) {
  const sorted = [...players].sort((a, b) => (b.Score ?? 0) - (a.Score ?? 0))

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Team header */}
      <div style={{
        background: `linear-gradient(135deg, ${accentColor}, ${accentDark})`,
        borderRadius: '10px 10px 0 0',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {teamName}
          </span>
          {isWinner && (
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              padding: '2px 9px',
              borderRadius: 99,
              textTransform: 'uppercase',
            }}>
              WINNER
            </span>
          )}
        </div>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 40, lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
          {teamScore ?? 0}
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr repeat(6, 52px)',
        padding: '7px 20px',
        background: 'rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          PLAYER
        </span>
        {STAT_COLS.map((col) => (
          <span key={col.key} style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            {col.label}
          </span>
        ))}
      </div>

      {/* Player rows */}
      {sorted.map((p, i) => (
        <div key={p.Name ?? i} style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(6, 52px)',
          padding: '9px 20px',
          background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          alignItems: 'center',
        }}>
          <span style={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 17,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {p.Name}
          </span>
          {STAT_COLS.map((col) => {
            const val = p[col.key] ?? 0
            const highlight = col.key !== 'Score' && val > 0
            return (
              <span key={col.key} style={{
                color: highlight ? '#fff' : 'rgba(255,255,255,0.45)',
                fontWeight: highlight ? 700 : 400,
                fontSize: 17,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {val}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function PostMatchStats() {
  const postMatchStats = useGameStore((s) => s.postMatchStats)
  const postMatchHiding = useGameStore((s) => s.postMatchHiding)
  const finalizeHidePostMatch = useGameStore((s) => s.finalizeHidePostMatch)
  const seriesState = useGameStore((s) => s.seriesState)

  if (!postMatchStats) return null

  const { players, game } = postMatchStats
  const teams = game?.Teams ?? []

  const team0 = teams.find((t) => t.TeamNum === 0)
  const team1 = teams.find((t) => t.TeamNum === 1)

  const players0 = players.filter((p) => p.TeamNum === 0)
  const players1 = players.filter((p) => p.TeamNum === 1)

  // Use admin-configured names if set, fall back to RL-provided names
  const name0 = seriesState.teams[0]?.name || team0?.Name || 'Blue'
  const name1 = seriesState.teams[1]?.name || team1?.Name || 'Orange'

  // Determine winner
  const isTeam0Winner = game?.Winner
    ? (game.Winner === team0?.Name || game.Winner === name0)
    : (team0?.Score ?? 0) > (team1?.Score ?? 0)

  return (
    <div
      onAnimationEnd={() => { if (postMatchHiding) finalizeHidePostMatch() }}
      style={{
        width: 1920,
        height: 1080,
        background: 'rgb(8, 12, 24)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: postMatchHiding ? 'pmFadeOut 0.4s ease both' : 'pmFadeIn 0.4s ease both',
        padding: '0 80px',
        boxSizing: 'border-box',
      }}>
      {/* "FINAL SCORE" label */}
      <div style={{
        textAlign: 'center',
        marginBottom: 14,
        color: 'rgba(255,255,255,0.45)',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
      }}>
        Final Score
      </div>

      {/* Two-team tables */}
      <div style={{
        display: 'flex',
        gap: 12,
        width: '100%',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 12px 60px rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <TeamTable
          players={players0}
          teamName={name0}
          teamScore={team0?.Score}
          accentColor="#2563EB"
          accentDark="#1D4ED8"
          isWinner={isTeam0Winner}
        />

        {/* Divider */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        <TeamTable
          players={players1}
          teamName={name1}
          teamScore={team1?.Score}
          accentColor="#EA580C"
          accentDark="#C2410C"
          isWinner={!isTeam0Winner}
        />
      </div>
    </div>
  )
}
