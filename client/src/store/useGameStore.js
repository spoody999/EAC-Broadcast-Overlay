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

  // Actions
  setRelayConnected: (connected) => set({ relayConnected: connected }),
  setRLConnected: (connected) => set({ rlConnected: connected }),

  applyInit: ({ series, rlConnected }) =>
    set({ seriesState: series, rlConnected }),

  applyUpdateState: (data) =>
    set({
      gameState: {
        matchGuid: data.MatchGuid ?? null,
        players: data.Players ?? [],
        game: data.Game ?? null,
      },
    }),

  applyGoalScored: (data) => set({ lastGoal: data }),

  clearLastGoal: () => set({ lastGoal: null }),

  applySeriesUpdated: (series) => set({ seriesState: series }),

  resetGameState: () => set({ gameState: initialGameState }),
}))
