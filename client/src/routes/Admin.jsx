import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

const API = '/api'

function StatusDot({ connected, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          connected ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500'
        }`}
      />
      <span className="text-sm text-white/60">{label}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
      <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">
        {title}
      </h2>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-white/50 text-xs">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/60 transition-colors"
      />
    </label>
  )
}

function Button({ onClick, children, variant = 'default', disabled }) {
  const base = 'px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    default: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    blue: 'bg-blue-600 hover:bg-blue-500 text-white',
    orange: 'bg-orange-500 hover:bg-orange-400 text-white',
    danger: 'bg-red-600/80 hover:bg-red-500 text-white',
  }
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export default function Admin() {
  const relayConnected = useGameStore((s) => s.relayConnected)
  const rlConnected = useGameStore((s) => s.rlConnected)
  const seriesState = useGameStore((s) => s.seriesState)
  const gameState = useGameStore((s) => s.gameState)
  const postMatchStats = useGameStore((s) => s.postMatchStats)

  // Local form state (mirrors seriesState until saved)
  const [blueName, setBlueName] = useState('')
  const [orangeName, setOrangeName] = useState('')
  const [blueLogoUrl, setBlueLogoUrl] = useState('')
  const [orangeLogoUrl, setOrangeLogoUrl] = useState('')
  const [format, setFormat] = useState('BO5')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'ok' | 'error'

  // Sync form from store on load / when seriesState changes from server
  useEffect(() => {
    setBlueName(seriesState.teams[0]?.name ?? 'Blue')
    setOrangeName(seriesState.teams[1]?.name ?? 'Orange')
    setBlueLogoUrl(seriesState.teams[0]?.logoUrl ?? '')
    setOrangeLogoUrl(seriesState.teams[1]?.logoUrl ?? '')
    setFormat(seriesState.format ?? 'BO5')
  }, [seriesState])

  // Add admin-view class to body for solid background
  useEffect(() => {
    document.body.classList.add('admin-view')
    return () => document.body.classList.remove('admin-view')
  }, [])

  async function saveConfig() {
    setSaving(true)
    setSaveStatus(null)
    try {
      const res = await fetch(`${API}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teams: [
            { name: blueName, logoUrl: blueLogoUrl },
            { name: orangeName, logoUrl: orangeLogoUrl },
          ],
          format,
        }),
      })
      if (!res.ok) throw new Error('Server error')
      setSaveStatus('ok')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  async function adjustWins(teamNum, delta) {
    const current = seriesState.teams[teamNum]?.seriesWins ?? 0
    const next = Math.max(0, current + delta)
    await fetch(`${API}/series/wins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamNum, wins: next }),
    })
  }

  async function resetSeries() {
    await fetch(`${API}/series/reset`, { method: 'POST' })
  }

  const game = gameState.game
  const teams = game?.Teams ?? []
  const blueScore = teams.find((t) => t.TeamNum === 0)?.Score ?? '--'
  const orangeScore = teams.find((t) => t.TeamNum === 1)?.Score ?? '--'
  const timeSeconds = game?.TimeSeconds
  const isOT = game?.bOvertime

  function formatTime(s) {
    if (s == null) return '--:--'
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">RL Overlay Admin</h1>
            <p className="text-white/40 text-sm mt-0.5">Broadcast control panel</p>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <StatusDot connected={relayConnected} label="Relay server" />
            <StatusDot connected={rlConnected} label="Rocket League" />
          </div>
        </div>

        {/* Live game snapshot */}
        <Section title="Live Game">
          {game ? (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">{blueScore}</span>
                <span className="text-white/30">–</span>
                <span className="text-orange-400 font-bold">{orangeScore}</span>
              </div>
              <div className="text-white/60">
                {isOT ? 'Overtime' : formatTime(timeSeconds)}
              </div>
              {game.bReplay && (
                <div className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full">
                  Replay
                </div>
              )}
              {game.bHasWinner && (
                <div className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full">
                  Winner: {game.Winner}
                </div>
              )}
              <div className="text-white/30 text-xs ml-auto">
                {gameState.players.length} players • {game.Arena}
              </div>
            </div>
          ) : (
            <p className="text-white/30 text-sm">
              {rlConnected ? 'In menus / no active game' : 'Waiting for Rocket League…'}
            </p>
          )}
        </Section>

        {/* Series score controls */}
        <Section title="Series Score">
          <div className="flex items-center gap-6">
            {/* Blue */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-blue-400 font-bold text-sm">{blueName || 'Blue'}</span>
              <div className="flex items-center gap-2">
                <Button onClick={() => adjustWins(0, -1)}>−</Button>
                <span className="text-white font-black text-2xl tabular-nums w-6 text-center">
                  {seriesState.teams[0]?.seriesWins ?? 0}
                </span>
                <Button onClick={() => adjustWins(0, 1)} variant="blue">+</Button>
              </div>
            </div>

            <span className="text-white/20 font-bold text-lg flex-1 text-center">vs</span>

            {/* Orange */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-orange-400 font-bold text-sm">{orangeName || 'Orange'}</span>
              <div className="flex items-center gap-2">
                <Button onClick={() => adjustWins(1, -1)}>−</Button>
                <span className="text-white font-black text-2xl tabular-nums w-6 text-center">
                  {seriesState.teams[1]?.seriesWins ?? 0}
                </span>
                <Button onClick={() => adjustWins(1, 1)} variant="orange">+</Button>
              </div>
            </div>

            <Button onClick={resetSeries} variant="danger" className="ml-auto">
              Reset Series
            </Button>
          </div>
        </Section>

        {/* Team config */}
        <Section title="Team Configuration">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider">Blue Team</h3>
              <Input label="Team Name" value={blueName} onChange={setBlueName} placeholder="Blue" />
              <Input label="Logo URL" value={blueLogoUrl} onChange={setBlueLogoUrl} placeholder="https://…" />
            </div>
            <div className="space-y-3">
              <h3 className="text-orange-400 text-xs font-bold uppercase tracking-wider">Orange Team</h3>
              <Input label="Team Name" value={orangeName} onChange={setOrangeName} placeholder="Orange" />
              <Input label="Logo URL" value={orangeLogoUrl} onChange={setOrangeLogoUrl} placeholder="https://…" />
            </div>
          </div>

          {/* Format selector */}
          <div className="mt-4">
            <span className="text-white/50 text-xs block mb-2">Series Format</span>
            <div className="flex gap-2">
              {['BO3', 'BO5', 'BO7'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    format === f
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button onClick={saveConfig} variant="blue" disabled={saving}>
              {saving ? 'Saving…' : 'Save Configuration'}
            </Button>
            {saveStatus === 'ok' && (
              <span className="text-green-400 text-sm">Saved!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm">Save failed — is the server running?</span>
            )}
          </div>
        </Section>

        {/* Post-Match Stats */}
        <Section title="Post-Match Stats">
          <p className="text-white/50 text-sm mb-3">
            Shown automatically when RL reports a winner. Use these controls to manually override.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="blue"
              disabled={!gameState.game}
              onClick={() => fetch(`${API}/postmatch/show`, { method: 'POST' })}
            >
              Show Now (current state)
            </Button>
            <Button
              variant="danger"
              disabled={!postMatchStats}
              onClick={() => fetch(`${API}/postmatch/hide`, { method: 'POST' })}
            >
              Hide / Dismiss
            </Button>
            {postMatchStats && (
              <span className="text-green-400 text-sm font-semibold">● Showing on overlay</span>
            )}
            {!postMatchStats && (
              <span className="text-white/30 text-sm">Not currently shown</span>
            )}
          </div>
        </Section>

        {/* Overlay link */}
        <Section title="Overlay">
          <p className="text-white/50 text-sm mb-3">
            Add this URL as an OBS Browser Source at <strong className="text-white">1920 × 1080</strong>.
          </p>
          <div className="flex items-center gap-3">
            <code className="bg-black/40 text-green-300 text-sm px-3 py-2 rounded-lg flex-1 font-mono">
              {window.location.origin}/overlay
            </code>
            <Button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/overlay`)}
            >
              Copy
            </Button>
            <Button
              onClick={() => window.open('/overlay', '_blank')}
            >
              Open
            </Button>
          </div>
        </Section>

      </div>
    </div>
  )
}
