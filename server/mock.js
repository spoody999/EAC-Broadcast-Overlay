/**
 * mock.js — Development mock for the Rocket League Stats API TCP socket.
 *
 * Run with:  node server/mock.js
 *
 * This script starts a raw TCP server on port 49123 (same port the RL
 * Stats API uses) and streams a scripted sequence of newline-delimited
 * JSON events so you can develop the overlay without a running copy of
 * Rocket League.
 *
 * Usage:
 *   1. Start this mock:   node server/mock.js
 *   2. Start the relay:   npm run dev --workspace=server
 *      (or `npm run dev` from the root to start everything)
 *   3. Open the overlay:  http://localhost:5173/overlay
 */

import net from 'net'

const PORT = 49123
const HOST = '127.0.0.1'

const server = net.createServer()
server.listen(PORT, HOST, () => {
  console.log(`[mock] RL Stats API mock listening on tcp://${HOST}:${PORT}`)
})

const MATCH_GUID = 'MOCK0000000000000000000000000001'

// Helper: send a newline-delimited JSON event to a specific socket
function send(socket, event, data) {
  if (socket.destroyed || !socket.writable) return
  const raw = JSON.stringify({ Event: event, Data: { MatchGuid: MATCH_GUID, ...data } })
  socket.write(raw + '\n')
  console.log(`[mock] → ${event}`)
}

// Alias for single-client use inside runSequence
let broadcast = () => {}

// Build a mock UpdateState payload
function makeUpdateState(timeSeconds, blueScore, orangeScore, blueBoost, orangeBoost, overtime = false) {
  return {
    MatchGuid: MATCH_GUID,
    Players: [
      {
        Name: 'Jstn',
        PrimaryId: 'Epic|100|0',
        Shortcut: 1,
        TeamNum: 0,
        Score: 175,
        Goals: blueScore,
        Shots: 3,
        Assists: 1,
        Saves: 0,
        Touches: 22,
        CarTouches: 5,
        Demos: 0,
        bHasCar: true,
        Speed: 1400,
        Boost: blueBoost[0],
        bBoosting: blueBoost[0] > 50,
        bOnGround: true,
        bOnWall: false,
        bPowersliding: false,
        bDemolished: false,
        bSupersonic: false,
      },
      {
        Name: 'Garrett',
        PrimaryId: 'Epic|101|0',
        Shortcut: 2,
        TeamNum: 0,
        Score: 140,
        Goals: 0,
        Shots: 2,
        Assists: 1,
        Saves: 1,
        Touches: 18,
        CarTouches: 3,
        Demos: 1,
        bHasCar: true,
        Speed: 900,
        Boost: blueBoost[1],
        bBoosting: false,
        bOnGround: false,
        bOnWall: true,
        bPowersliding: false,
        bDemolished: false,
        bSupersonic: false,
      },
      {
        Name: 'Mrcatmint',
        PrimaryId: 'Epic|102|0',
        Shortcut: 3,
        TeamNum: 0,
        Score: 90,
        Goals: 0,
        Shots: 1,
        Assists: 0,
        Saves: 1,
        Touches: 11,
        CarTouches: 2,
        Demos: 0,
        bHasCar: true,
        Speed: 600,
        Boost: blueBoost[2],
        bBoosting: false,
        bOnGround: true,
        bOnWall: false,
        bPowersliding: false,
        bDemolished: false,
        bSupersonic: false,
      },
      {
        Name: 'Vatira',
        PrimaryId: 'Epic|200|0',
        Shortcut: 4,
        TeamNum: 1,
        Score: 165,
        Goals: orangeScore,
        Shots: 4,
        Assists: 0,
        Saves: 0,
        Touches: 20,
        CarTouches: 4,
        Demos: 0,
        bHasCar: true,
        Speed: 1800,
        Boost: orangeBoost[0],
        bBoosting: true,
        bOnGround: false,
        bOnWall: false,
        bPowersliding: false,
        bDemolished: false,
        bSupersonic: true,
      },
      {
        Name: 'Kassio',
        PrimaryId: 'Epic|201|0',
        Shortcut: 5,
        TeamNum: 1,
        Score: 130,
        Goals: 0,
        Shots: 2,
        Assists: 1,
        Saves: 0,
        Touches: 14,
        CarTouches: 3,
        Demos: 0,
        bHasCar: true,
        Speed: 1100,
        Boost: orangeBoost[1],
        bBoosting: false,
        bOnGround: true,
        bOnWall: false,
        bPowersliding: true,
        bDemolished: false,
        bSupersonic: false,
      },
      {
        Name: 'Monkey Moon',
        PrimaryId: 'Epic|202|0',
        Shortcut: 6,
        TeamNum: 1,
        Score: 85,
        Goals: 0,
        Shots: 1,
        Assists: 1,
        Saves: 1,
        Touches: 9,
        CarTouches: 1,
        Demos: 0,
        bHasCar: true,
        Speed: 450,
        Boost: orangeBoost[2],
        bBoosting: false,
        bOnGround: true,
        bOnWall: false,
        bPowersliding: false,
        bDemolished: false,
        bSupersonic: false,
      },
    ],
    Game: {
      Teams: [
        { Name: 'NRG', TeamNum: 0, Score: blueScore, ColorPrimary: '0000FF', ColorSecondary: '0000AA' },
        { Name: 'G2', TeamNum: 1, Score: orangeScore, ColorPrimary: 'FF6600', ColorSecondary: 'AA4400' },
      ],
      TimeSeconds: timeSeconds,
      bOvertime: overtime,
      Frame: 0,
      Elapsed: 0,
      Ball: { Speed: 1200, TeamNum: 0 },
      bReplay: false,
      bHasWinner: false,
      Winner: '',
      Arena: 'Stadium_P',
      bHasTarget: true,
      Target: { Name: 'Jstn', Shortcut: 1, TeamNum: 0 },
    },
  }
}

server.on('connection', (socket) => {
  console.log('[mock] Client connected — starting match sequence…')
  socket.on('error', () => {}) // suppress broken-pipe errors if client disconnects mid-sequence
  broadcast = (event, data) => send(socket, event, data)
  runSequence()
})

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function runSequence() {
  // Match lifecycle
  await sleep(500)
  broadcast('MatchCreated', {})

  await sleep(500)
  broadcast('MatchInitialized', {})

  await sleep(500)
  broadcast('CountdownBegin', {})

  await sleep(2000)
  broadcast('RoundStarted', {})

  // Tick down from 5:00 — send UpdateState at ~10Hz, clock every second
  let time = 300
  let blueScore = 0
  let orangeScore = 0

  // Run for 30 seconds of simulated game time (3 seconds real time at 10x speed)
  const TICK_MS = 100    // real ms per tick
  const TICKS_PER_SEC = 10

  // Phase 1: 0–20 simulated seconds (no goal)
  for (let t = 0; t < 20 * TICKS_PER_SEC; t++) {
    const blueBoost = [
      Math.min(100, 20 + (t * 3) % 100),
      Math.min(100, 60 - (t * 2) % 60),
      Math.min(100, 10 + (t * 5) % 100),
    ]
    const orangeBoost = [
      Math.min(100, 80 - (t * 2) % 80),
      Math.min(100, 30 + (t * 4) % 70),
      Math.min(100, 50 + (t * 3) % 50),
    ]

    broadcast('UpdateState', makeUpdateState(time, blueScore, orangeScore, blueBoost, orangeBoost))

    if (t % TICKS_PER_SEC === 0) {
      time--
      broadcast('ClockUpdatedSeconds', { TimeSeconds: time, bOvertime: false })
    }

    await sleep(TICK_MS)
  }

  // Goal by blue team
  broadcast('GoalScored', {
    GoalSpeed: 1870.5,
    GoalTime: 20.0,
    ImpactLocation: { X: 0, Y: -5120, Z: 320 },
    Scorer: { Name: 'Jstn', Shortcut: 1, TeamNum: 0 },
    Assister: { Name: 'Garrett', Shortcut: 2, TeamNum: 0 },
    BallLastTouch: {
      Player: { Name: 'Jstn', Shortcut: 1, TeamNum: 0 },
      Speed: 1870.5,
    },
  })
  blueScore = 1

  // Goal replay
  await sleep(500)
  broadcast('GoalReplayStart', {})
  await sleep(3000)
  broadcast('GoalReplayWillEnd', {})
  await sleep(500)
  broadcast('GoalReplayEnd', {})

  // Countdown for next round
  broadcast('CountdownBegin', {})
  await sleep(2000)
  broadcast('RoundStarted', {})

  // Phase 2: 20 more simulated seconds
  for (let t = 0; t < 20 * TICKS_PER_SEC; t++) {
    const blueBoost = [
      Math.min(100, 45 + (t * 2) % 55),
      Math.min(100, 10 + (t * 6) % 90),
      Math.min(100, 70 - (t * 3) % 70),
    ]
    const orangeBoost = [
      Math.min(100, 5 + (t * 7) % 95),
      Math.min(100, 85 - (t * 4) % 85),
      Math.min(100, 20 + (t * 5) % 80),
    ]

    broadcast('UpdateState', makeUpdateState(time, blueScore, orangeScore, blueBoost, orangeBoost))

    if (t % TICKS_PER_SEC === 0) {
      time--
      broadcast('ClockUpdatedSeconds', { TimeSeconds: time, bOvertime: false })
    }

    await sleep(TICK_MS)
  }

  // Orange equalizes
  broadcast('GoalScored', {
    GoalSpeed: 2100.0,
    GoalTime: 40.0,
    ImpactLocation: { X: 0, Y: 5120, Z: 320 },
    Scorer: { Name: 'Vatira', Shortcut: 4, TeamNum: 1 },
    BallLastTouch: {
      Player: { Name: 'Vatira', Shortcut: 4, TeamNum: 1 },
      Speed: 2100.0,
    },
  })
  orangeScore = 1

  await sleep(500)
  broadcast('GoalReplayStart', {})
  await sleep(2500)
  broadcast('GoalReplayWillEnd', {})
  await sleep(500)
  broadcast('GoalReplayEnd', {})

  broadcast('CountdownBegin', {})
  await sleep(2000)
  broadcast('RoundStarted', {})

  // Phase 3: overtime
  time = 0
  for (let t = 0; t < 10 * TICKS_PER_SEC; t++) {
    const blueBoost = [Math.min(100, (t * 8) % 100), Math.min(100, 100 - (t * 5) % 100), Math.min(100, (t * 3) % 100)]
    const orangeBoost = [Math.min(100, 100 - (t * 7) % 100), Math.min(100, (t * 4) % 100), Math.min(100, 50 + (t * 6) % 50)]

    broadcast('UpdateState', makeUpdateState(0, blueScore, orangeScore, blueBoost, orangeBoost, true))
    await sleep(TICK_MS)
  }

  // Blue wins in OT
  broadcast('GoalScored', {
    GoalSpeed: 2250.0,
    GoalTime: 10.0,
    ImpactLocation: { X: 50, Y: -5120, Z: 200 },
    Scorer: { Name: 'Jstn', Shortcut: 1, TeamNum: 0 },
    BallLastTouch: {
      Player: { Name: 'Jstn', Shortcut: 1, TeamNum: 0 },
      Speed: 2250.0,
    },
  })
  blueScore = 2

  await sleep(500)
  broadcast('MatchEnded', { WinnerTeamNum: 0 })

  await sleep(2000)
  broadcast('PodiumStart', {})

  await sleep(3000)
  broadcast('MatchDestroyed', {})

  console.log('[mock] Sequence complete.')
}
