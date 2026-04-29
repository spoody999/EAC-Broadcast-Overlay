import { create } from 'zustand'

const initialGameState = {
  matchGuid: null,
  players: [],
  game: null,
}

const initialSeriesState = {
  teams: [
    { name: 'Blue', logoUrl: '', seriesWins: 0 },
    { name: 'Orange', logoUrl: '', seriesWins: 0 },
  ],
  format: 'BO5',
  matchGuid: null,
}

export const useGameStore = create((set) => ({
  // Connection state
  rlConnected: false,
  relayConnected: false,

  // Live game state (from UpdateState)
  gameState: initialGameState,

  // Series state (from server REST + _seriesUpdated events)
  seriesState: initialSeriesState,

  // Last goal event (for notification)
  lastGoal: null,

  // Post-match stats snapshot (shown after bHasWinner, cleared on new match)
  postMatchStats: null,

  // True while the hide-animation is playing; component unmounts on animationEnd
  postMatchHiding: false,

  // Replay state — set on goal detection, cleared on CountdownBegin/RoundStarted
  isReplay: false,

  // Internal: holds scorer info for one frame so the assister (arrives next frame) can be included
  _pendingGoal: null,

  // Set by MatchEnded; consumed when snapshotting post-match stats
  lastWinnerTeamNum: null,

  // Actions
  setRelayConnected: (connected) => set({ relayConnected: connected }),
  setRLConnected: (connected) => set({ rlConnected: connected }),
  setIsReplay: (value) => set({ isReplay: value }),
  setLastWinnerTeamNum: (teamNum) => set({ lastWinnerTeamNum: teamNum }),

  applyInit: ({ series, rlConnected }) =>
    set({ seriesState: series, rlConnected }),

  applyUpdateState: (data) =>
    set((state) => {
      const newPlayers = data.Players ?? []
      const newGame = data.Game ?? null
      const sameMatch = data.MatchGuid === state.gameState.matchGuid

      const newGameState = {
        matchGuid: data.MatchGuid ?? null,
        players: newPlayers,
        game: newGame,
      }

      const updates = { gameState: newGameState }

      // When a new match starts (new MatchGuid), clear per-match state
      if (!sameMatch) {
        updates.lastWinnerTeamNum = null
        if (state.postMatchStats) {
          updates.postMatchStats = null
          updates.postMatchHiding = false
          updates.isReplay = false
          updates._pendingGoal = null
        }
      }

      // Goal detection paths only fire when there is a pending goal (one frame
      // after a score change) or a new score delta. Build a name lookup once
      // so the inner scans are O(1) instead of O(n) per player.
      const prevGame = sameMatch ? state.gameState.game : null
      const hasPendingGoal = state._pendingGoal && sameMatch

      let scoringTeamIdx = -1
      if (prevGame && newGame && sameMatch && !state._pendingGoal) {
        const prevTeams = prevGame.Teams ?? []
        const newTeams = newGame.Teams ?? []
        for (let i = 0; i < Math.min(newTeams.length, prevTeams.length); i++) {
          if ((newTeams[i].Score ?? 0) > (prevTeams[i]?.Score ?? 0)) {
            scoringTeamIdx = i
            break
          }
        }
      }

      let prevByName = null
      if (hasPendingGoal || scoringTeamIdx !== -1) {
        prevByName = new Map()
        for (const p of state.gameState.players ?? []) prevByName.set(p.Name, p)
      }

      // Step 1: resolve a pending goal's assister
      if (hasPendingGoal) {
        const { scorer, teamNum } = state._pendingGoal
        let assister = null
        for (const p of newPlayers) {
          if (p.TeamNum !== teamNum) continue
          const prev = prevByName.get(p.Name)
          if (prev && (p.Assists ?? 0) > (prev.Assists ?? 0)) {
            assister = { Name: p.Name, TeamNum: p.TeamNum }
            break
          }
        }
        updates.lastGoal = { Scorer: scorer, Assister: assister, TeamNum: teamNum }
        updates._pendingGoal = null
      }

      // Step 2: detect a new goal via team score delta (GoalScored event never fires)
      if (scoringTeamIdx !== -1) {
        const team = newGame.Teams[scoringTeamIdx]
        let scorer = null
        for (const p of newPlayers) {
          if (p.TeamNum !== team.TeamNum) continue
          const prev = prevByName.get(p.Name)
          if (prev && (p.Goals ?? 0) > (prev.Goals ?? 0)) {
            scorer = { Name: p.Name, TeamNum: p.TeamNum }
            break
          }
        }
        updates._pendingGoal = {
          scorer: scorer ?? { Name: 'Unknown', TeamNum: team.TeamNum },
          teamNum: team.TeamNum,
        }
        updates.isReplay = true
      }

      return updates
    }),

  applyGoalScored: (data) => set({ lastGoal: data }),

  clearLastGoal: () => set({ lastGoal: null }),

  setPostMatchStats: (stats) => set({ postMatchStats: stats, postMatchHiding: false }),
  // Start the hide animation — component calls finalizeHidePostMatch on animationEnd
  clearPostMatchStats: () => set({ postMatchHiding: true }),
  finalizeHidePostMatch: () => set({ postMatchStats: null, postMatchHiding: false }),

  applySeriesUpdated: (series) => set({ seriesState: series }),

  resetGameState: () => set({ gameState: initialGameState, _pendingGoal: null, postMatchStats: null, postMatchHiding: false, isReplay: false, lastWinnerTeamNum: null }),
}))
