import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STORE_PATH = join(__dirname, 'series.json')

const DEFAULTS = {
  teams: [
    { name: 'Blue', logoUrl: '', seriesWins: 0 },
    { name: 'Orange', logoUrl: '', seriesWins: 0 },
  ],
  format: 'BO5', // 'BO3' | 'BO5' | 'BO7'
  matchGuid: null,
}

export const VALID_FORMATS = ['BO3', 'BO5', 'BO7']
const MAX_NAME_LEN = 80
const MAX_URL_LEN = 2048

function isValidLogoUrl(s) {
  if (s === '') return true
  if (typeof s !== 'string' || s.length > MAX_URL_LEN) return false
  return /^https?:\/\//i.test(s)
}

function isValidName(s) {
  return typeof s === 'string' && s.length <= MAX_NAME_LEN
}

function load() {
  if (!existsSync(STORE_PATH)) return structuredClone(DEFAULTS)
  try {
    return JSON.parse(readFileSync(STORE_PATH, 'utf8'))
  } catch {
    return structuredClone(DEFAULTS)
  }
}

function save(state) {
  writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8')
}

let state = load()

export function getSeries() {
  return structuredClone(state)
}

export function updateSeriesConfig({ teams, format }) {
  if (teams !== undefined) {
    if (!Array.isArray(teams)) throw new Error('teams must be an array')
    teams.forEach((t, i) => {
      if (!state.teams[i] || t == null || typeof t !== 'object') return
      if (t.name !== undefined) {
        if (!isValidName(t.name)) throw new Error('team name must be a string up to 80 chars')
        state.teams[i].name = t.name
      }
      if (t.logoUrl !== undefined) {
        if (!isValidLogoUrl(t.logoUrl)) throw new Error('logoUrl must be empty or http(s)://')
        state.teams[i].logoUrl = t.logoUrl
      }
    })
  }
  if (format !== undefined) {
    if (!VALID_FORMATS.includes(format)) throw new Error(`format must be one of ${VALID_FORMATS.join(', ')}`)
    state.format = format
  }
  save(state)
  return structuredClone(state)
}

export function incrementSeriesWin(teamNum) {
  if (teamNum !== 0 && teamNum !== 1) throw new Error('Invalid teamNum')
  state.teams[teamNum].seriesWins += 1
  save(state)
  return structuredClone(state)
}

export function setSeriesWins(teamNum, wins) {
  if (teamNum !== 0 && teamNum !== 1) throw new Error('Invalid teamNum')
  if (!Number.isInteger(wins) || wins < 0) throw new Error('Invalid wins value')
  state.teams[teamNum].seriesWins = wins
  save(state)
  return structuredClone(state)
}

export function resetSeries() {
  state.teams[0].seriesWins = 0
  state.teams[1].seriesWins = 0
  state.matchGuid = null
  save(state)
  return structuredClone(state)
}

export function setMatchGuid(guid) {
  state.matchGuid = guid
  save(state)
}
