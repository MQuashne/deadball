//back from pitcher to roll button won't move 

import { store } from '../model/store.js'
import { teams } from '../model/teams.js'
import { G } from '../model/game.js'
import { calculateSwingTable, calculateCritHitTable ,calculateTable} from '../actions/tables.js'
//import {swingTable} from '../model/tables.js'
import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js'

const pd_map = {
  0: "-D20",
  1: "-D12",
  2: "-D8",
  3: "-D4",
  4: "D4",
  5: "D8",
  6: "D12",
  7: "D20"
};

const ADVANCE_BY = { "1B": 1, "2B": 2, "3B": 3, "HR": 4 };


export function resetField() {
  
  let opp = teams[Math.floor(Math.random() * 30)].code;
  store.update((state) => {
    state.game = {
      opponent: teams.find((t) => t.code === opp),
      home: true,
      process: "swing",
      mode: "roll",
      lastProcess: "",
      roll: [],
      outcome: "",
      inning: 1,
      half: 1,
      atBat: false,
      inProgress: true,
      outs: 0,
      score: [0, 0],
      runners: [],
      scoreboard: [
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ],
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ],
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ],
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ],
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ],
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ],
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ],
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ],
        [
          { hits: 0, runs: 0, errors: 0 },
          { hits: 0, runs: 0, errors: 0 }
        ]
      ]
    }
    resetTeams();
  }, ["field:reset"]);
}

function resetTeams() {
  store.update((state) => {
    [...state.thisTeam.lineup.rotation, ...state.thisTeam.lineup.bullpen, ...state.thisTeam.lineup.pitcherReserve, ...state.game.opponent.lineup.rotation, ...state.game.opponent.lineup.bullpen, ...state.game.opponent.lineup.pitcherReserve].forEach((pi) => {
      pi.ip = 0;
      pi.handBonus = false;
      pi.gameStats = [];
      pi.scoreless = 0;
      pi.inningK = 0;
      pi.jamEscape = false;
      pi.threeRunInning = false;
      pi.fourRunTwoInning = false;
      pi.inningsOverSix = 0;
      pi.threeUpDown = false;
      pi.threeScoreless = false;
      pi.rpRuns = 0;
      pi.rpInningsOverOne = 0;
    });
    
    state.thisTeam.lineup.pitcher = state.thisTeam.lineup.rotation[state.thisTeam.currentRotationIndex];
    state.thisTeam.lineup.pitcher.gameStats.push(addPitcherInning(1));
    
    state.game.opponent.lineup.pitcher = state.game.opponent.lineup.rotation[state.game.opponent.currentRotationIndex];
    state.game.opponent.lineup.pitcher.gameStats.push(addPitcherInning(1));
    
  }, ["players:reset"])
}



function addPitcherInning(inn) {
  const stats = {
    inning: inn,
    outs: 0,
    K: 0,
    R: 0,
    ER: 0,
    BB: 0,
    BF: 0,
    H: 0,
    "1B": 0,
    "2B": 0,
    "3B": 0,
    HR: 0,
    WP: 0,
    BK: 0,
    GB: 0,
    FB: 0,
    E: 0,
  };
  
  return stats;
}



function addBatterInning(inn) {
  const stats = {
    inning: inn,
    PA: 0,
    AB: 0,
    H: 0,
    R: 0,
    K: 0,
    BB: 0,
    HBP: 0,
    IBB: 0,
    "1B": 0,
    "2B": 0,
    "3B": 0,
    HR: 0,
    RBI: 0,
    SB: 0,
    CS: 0,
    PO: 0,
    A: 0,
    E: 0,
    play:"",
    lastBase:0,
    basePlayers:{
      2:"",
      3:"",
      4:""
    },
    hitLoc:""
  };
  return stats;
}



export function buildPitchDie(pitcher) {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  //const pitcher = fieldTeam.lineup.pitcher;
  
  //pitcher will have stats bu inning,
  pitcher.tempPdValue = pitcher.pdValue;
  pitcher.tempPD = pd_map[pitcher.pdValue];
  //Handedness
  if (pitcher.hand === batTeam.lineup.order[batTeam.currentBatterIndex].hand && pitcher.type === "SP" && pitcher.tempPdValue < 6) {
    pitcher.tempPdValue++;
    //pitcher.tempPD = pd_map[pitcher.tempPdValue];
  }
  
  if (pitcher.jamEscape && pitcher.tempPdValue < 7) pitcher.tempPdValue++;
  if (pitcher.threeRunInning && pitcher.tempPdValue < 7) pitcher.tempPdValue++;
  if (pitcher.fourRunTwoInning && pitcher.tempPdValue < 7) pitcher.tempPdValue++;
  if (pitcher.threeUpDown && pitcher.tempPdValue < 7) pitcher.tempPdValue++;
  if (pitcher.threeScoreless && pitcher.tempPdValue < 7) pitcher.tempPdValue++;
  
  Math.max(pitcher.tempPdValue - pitcher.inningsOverSix, 0)
  
  if (pitcher.type === "RP") Math.max(pitcher.tempPdValue - pitcher.rpRuns - pitcher.rpInningsOverOne, 0);
  pitcher.tempPD = pd_map[pitcher.tempPdValue];
}

export function batterUp() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  const batter = batTeam.lineup.order[batTeam.currentBatterIndex];
  G.game.runners.push({
    player: batter,
    location: 0
  });
}

export function buildBatterSkill(batter) {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  const pitcher = fieldTeam.lineup.pitcher;
  [batter.tempBT, batter.tempOBT] = [batter.BT, batter.OBT];
  if (pitcher.K === "K+") batter.tempBT--;
  if (pitcher.CN === "CN+") batter.tempOBT -= 2;
  if (pitcher.CN === "CN-") batter.tempOBT += 3;
  if (G.game.runners.find(r => r.location > 1) && batter.C === "C-") {
    batter.tempOBT -= 3;
    batter.tempBT -= 3;
  }
}

//=============================
// RUNNER ADVANCEMENT
//=============================

export function advanceRunners(lastPlay,runAdvance=null) {
  store.update((state) => {
    const runners = state.game.runners;
    const batter = runners.find(r => r.location === 0);
    
    if (lastPlay === "BB") {
      advanceOnWalk(runners, batter);
    } else if (lastPlay === "SAC") {
      advanceOnSac(runners);
    } else {
      //It's a hit or we're in running mode 
      advanceOnHit(state, runners, lastPlay,runAdvance);
    }
  }, [
    ["runners:advanced", { lastPlay }]
  ]);
}

function advanceOnWalk(runners, batter) {
  const FB = runners.find(r => r.location === 1);
  const SB = runners.find(r => r.location === 2);
  const TB = runners.find(r => r.location === 3);
  
  batter.location = 1;
  if (FB) {
    FB.location = 2;
    if (SB) {
      SB.location = 3;
      if (TB) TB.location = 4;
    }
  }
}

function advanceOnSac(runners) {
  if (runners.length === 1) {
    //playerOut(getBatter())
  } else {
    if (G.game.outs < 2) {
      runners.forEach((r) => {
        if (r.location > 0) r.location++;
      });
    }
    // setTimeout(() => playerOut(getBatter()), 1200);
  }
}



function advanceOnHit(state, runners, lastPlay,runAdvance=null) {
  const batterAdvanceBy = ADVANCE_BY[lastPlay];

  runners.forEach((rn) => {
    if (rn.location === 0) {
      rn.location = Math.min(rn.location + batterAdvanceBy, 4);
    } else {
      rn.location = Math.min(rn.location + runAdvance, 4);
    }
  });
}

//=============================
// MODE/PROCESS STATE
//=============================

export function changeMode(mode) {
  store.update(state => {
    state.game.mode = mode;
  }, ["mode:changed"]);
}



export function changeProcess(process) {
  store.update(state => {
    state.game.process = process;
  }, ["process:changed"]);
}



export function changeProcessMode(process, mode) {
  store.update(state => {
    state.game.process = process;
    state.game.mode = mode;
  }, [
    ["process:changed"],
    ["mode:changed"]
  ]);
}



export function processSwingOutcome(roll) {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  const mss = roll[0] + roll[1] + (fieldTeam.lineup.pitcher.tempPdValue > 3 ? 1 : -1) * roll[2];
  const batter = batTeam.lineup.order[batTeam.currentBatterIndex];
  const swingTable = calculateSwingTable(batter);
  const outcome = swingTable.find(res => res.min <= mss & res.max >= mss).code;
  
  store.update((state) => {
    state.game.lastProcess = "swing";
    state.game.roll = roll;
    state.game.result = mss;
    state.game.outcome = outcome;
    changeProcess(outcome);
  }, [
    [`process:${outcome}`],
    [`swing:outcome`]
  ]);
}



export function processCritHitOutcome(roll) {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  const batter = batTeam.lineup.order[batTeam.currentBatterIndex];
  const resultTable = calculateTable[G.game.process](batter);
  const resultRow = resultTable.find(res => res.min <= roll[0] & res.max >= roll[0]);
 advanceRunners(resultRow.stat,resultRow.runAdvance);

  store.update((state) => {
    state.game.lastProcess = G.game.process;
    state.game.roll = roll;
    state.game.result = roll[0];
    state.game.outcome = resultRow.stat;
    changeProcess("endAB");
  }, [
    [`process:endAB`],
    [`critHit:outcome`]
  ]);
}



function getTeams() {
  const homeTeam = G.game.home ? G.thisTeam : G.game.opponent;
  const awayTeam = G.game.home ? G.game.opponent : G.thisTeam;
  const fieldTeam = ((G.game.home && G.game.half === 1) || (G.game.away && G.game.half === 2)) ? G.thisTeam : G.game.opponent;
  const batTeam = fieldTeam === G.thisTeam ? G.game.opponent : G.thisTeam;
  return [homeTeam, awayTeam, fieldTeam, batTeam]
}

/* PITCH DIE ADJUSTMENTS
Handed: +1 up to d12 for sp, d20 for rp

add for...
3  consecutive scoreless
3K inning
escape bases loaded no out with no runs

subtract for...
3+ run inning
4+ run 2 innings
every run over 4
every inning past 6

RELIEVERS:
subtract for...
every run
every 3 outs


*/






/*
PROCESSES 
hit
run
steal
field
pitch

MODE
roll
outcome
mod
reroll

extra die:
- always available, never sent back
handling:
1) offer with button "coach die" <- ugh... this one
2) min dice pool is 1 [last used]
 batter gives 1, have 2. use 2, 1 remains. batter gives 3, have 4. batter gives 2, have 6. use 5, have 1. that die is only used when the whole pool is.
 3) 1 die discount on everything and start with 1... [first used]
 start with 1, batter gives 1, have 2. use 2, have 1. batter gives 3, have 4. batter gives 2, have 6. use 5, have 2. 

let win;
//=============================
// GAME LIFECYCLE
//=============================

export function playBall() {
  const gameEvent = G.schedule.find(e => e.id === `G${G.gameNum}`);
  const thisGame = {
    home: gameEvent.home,
    opponent: G.opponents[G.gameNum - 1],
    order: [...G.lineup.order],
    inning: 7,
    half: 2,
    mode: "roll",
    process: "hit",
    currentRoll: [],
    currentOutcome: "out",
    atBat: gameEvent.home,
    inProgress: true,
    outs: 0,
    dice: 0,
    rerolls: 0,
    rerollAllowed: 99,
    mods: 0,
    modAllowed: 99,
    modsUsed: 0,
    score: [0, 0],
    currentBatterIndex: 0,
    pitcher: G.lineup.pitcher,
    pitchAdd: "",
    pitchesLeft: 0,
    oppTokensUsed: 0,
    must: false,
    batCoachUsed: false,
    runners: [],
    scoreboard: [
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ],
      [
        { hits: 0, runs: 0, errors: 0 },
        { hits: 0, runs: 0, errors: 0 }
      ]
    ]
  }
  store.update(state => {
    state.game = thisGame;
    state.game.mode = "roll";
    //state.game.process = G.game.home ? "hit" : "field";
    state.game.process = "start";
    state.lineup.bench.forEach(pl => pl.available = true);
    state.lineup.bullpen.forEach(pl => pl.available = true);
    state.lineup.order.forEach(pl => pl.available = false);
    state.lineup.pitcher.available = false;
    state.game.pitchesLeft = G.lineup.pitcher.fatigue > 10 ? 1 : G.lineup.pitcher.fatigue - G.lineup.pitcher.used;
    if (G.difficulty === "Rookie") {
      state.game.dice = 1;
      state.game.rerolls = 1;
      state.game.mods = 1;
    }
    $t("roll-surface").style.zIndex = 100;
  }, ["game:startedz"]);
  //firstBatter(getBatter());
  /*if (G.game.home) {
    store.emit("inning:offense");
  } else {
    store.emit("inning:defense");
  }
  
}

export function checkGameEnd(inningEnd = true) {
  //Bottom of the 9th or extras
  const lastOut = inningEnd ? (G.game.half === 2 && G.game.inning >= 9 && G.game.score[0] !== G.game.score[1]) : false;
  console.log("lastout check " + lastOut)
  
  //Top of 9th or extras home lead
  const homeWin = inningEnd ? (G.game.half === 1 && G.game.inning >= 9 && G.game.score[1] > G.game.score[0]) : false;
  console.log("homeWin check " + homeWin)
  
  //Walk off in bottom of 9th
  const walkOff = (G.game.half === 2 && G.game.inning >= 9 && G.game.score[1] > G.game.score[0]);
  console.log("walkOff check " + walkOff)
  
  if (lastOut || homeWin || walkOff) {
   win = ((G.game.home && G.game.score[1]>G.game.score[0]) || (!G.game.home && G.game.score[0]>G.game.score[1]));
   store.emit("game:finished",win);
   
    return true;
  } else {
    return false;
  }
}

export function endGame() {
  const thisEvent = G.schedule.find(ev => ev.status === "active");
  const nextEvent = G.schedule[G.schedule.findIndex(ev => ev.status === "active")+1];
  if (win){
    thisEvent.num < 3 ? G.seasonPoints++ : G.seasonPoints+=2;
    G.wins++;
  } else {
    G.losses++;
  }
  thisEvent.status="past";
  thisEvent.result = win ? "W" : "L";
  nextEvent.status="active";
  if (nextEvent.type==="game") G.gameNum++;
  G.game.inProgress=false;
  //make event past
  //set event result
  //determine next event
  //activate next event (next game for now)
  //reset gameboard
}

//=============================
// INNING MANAGEMENT
//=============================
export function startOffHalf() {
  changeProcess("hit");
  changeMode("roll");
  store.update(state => {
    if (G.difficulty === "Rookie") {
      state.game.dice = 1;
      state.game.rerolls = 1;
      state.game.mods = 1;
    } else {
      state.game.dice = 0;
      state.game.rerolls = 0;
      state.game.mods = 0;
    }
    state.game.rerollAllowed = 99;
    state.game.atBat = true;
    state.game.runners.push({ player: getBatter(), location: 0 });
    state.game.dice += getBatter().dice;
    state.game.rerolls += getBatter().reroll;
    state.game.mods += getBatter().modifier;
  }, ["inning:offense"]);
}

export function endOffHalf() {
  const gameEnd = checkGameEnd(true);
  if (gameEnd) { return; }
  store.emit("half:end")
  store.update(state => {
    state.game.outs = 0;
    state.game.runners = [];
    state.game.half = 2 - (state.game.half - 1);
    if (state.game.half === 1) {
      state.game.inning++;
    };
  });
  console.log(G)
  startDefHalf();
}

export function endDefHalf(runs) {
  const gameEnd = checkGameEnd(true);
  if (gameEnd) { return; }
  store.update(state => {
    if (!state.game.home) {
      state.game.scoreboard[G.game.inning-1][1].runs+=runs;
      state.game.score[1] += runs;
    } else {
      state.game.scoreboard[G.game.inning-1][0].runs+=runs;
      state.game.score[0] += runs;
    }
    store.emit("half:end")
    state.game.half = 2 - (state.game.half - 1);
    if (state.game.half === 1) {
      state.game.inning++;
    };
  }, ["score:changed"])
  console.log(G)
  startOffHalf();
}

export function startDefHalf() {
  changeProcess("field");
  changeMode("roll");
  store.update(state => {
    state.game.pitchesLeft = G.lineup.pitcher.fatigue > 10 ? 1 : G.lineup.pitcher.fatigue - G.lineup.pitcher.used;
    state.game.oppTokensUsed = 0;
    state.game.pitchAdd = "";
    state.game.rerollAllowed = 99;
    state.game.atBat = false;
  }, ["inning:defense"])
}

//=============================
// BATTER MANAGEMENTppppnnx_
//=============================

export function setLeadoff(i) {
  store.update(state => {
    state.game.currentBatterIndex = i;
    state.game.mode = "outcome";
  });
}

export function firstBatter(player) {
  /* store.update(state => {
     state.game.runners.push({ player: player, location: 0 });
     state.game.dice += player.dice;
     state.game.rerolls += player.reroll;
     state.game.mods += player.modifier;
     state.game.mode = "roll";
   });
}

export function subBatter(subOut, subIn) {
  store.update(state => {
    const batIdx = state.lineup.order.indexOf(subOut);
    const benchIdx = state.lineup.bench.indexOf(subIn);
    state.game.runners[state.game.runners.length - 1].player = subIn;
    state.game.dice += (subIn.dice - subOut.dice);
    state.game.rerolls += (subIn.reroll - subOut.reroll);
    state.game.mods += (subIn.modifier - subOut.modifier);
    [state.lineup.order[batIdx], state.lineup.bench[benchIdx]] = [state.lineup.bench[benchIdx], state.lineup.order[batIdx]];
    subOut.available = false;
    changeMode("roll");
  }, ["batter:sub"]);
}

export function nextBatter() {
  let batter;
  store.update(state => {
    state.game.currentBatterIndex < 8 ? state.game.currentBatterIndex++ : state.game.currentBatterIndex = 0;
    batter = state.lineup.order[state.game.currentBatterIndex];
    state.game.runners.push({ player: batter, location: 0 });
    state.game.dice += batter.dice;
    state.game.rerolls += batter.reroll;
    state.game.mods += batter.modifier;
    state.game.mode = "roll";
  }, ["batter:changed"]);
}

function getBatter() {
  return G.lineup.order[G.game.currentBatterIndex]
}



function maybeEnterRunMode(state, lastPlay) {
  const isHit = lastPlay !== "extraBases" && lastPlay !== "BB" && lastPlay !== "SAC";
  const runnersOnBase = state.game.runners.filter(r => r.location < 4).length;
  if (isHit && runnersOnBase >= 2) {
    state.game.mode = "run";
  } else if (lastPlay !== "SAC") {
    setTimeout(() => nextBatter(), 1000);
  }
}

//=============================
// OUTS AND SCORING
//=============================

export function playerOut(outPlayer) {
  const runnerIndex = G.game.runners.findIndex(r => r.player === outPlayer);
  const runnerLocation = G.game.runners[runnerIndex].location;
  console.log(G.game.runners)
  store.update(state => {
    state.game.runners.splice(runnerIndex, 1);
    
    state.game.outs++;
    state.game.process = "hit";
    state.game.mode = "roll";
  }, ["player:out", outPlayer]);
  console.log(G.game.runners)
  if (runnerLocation === 0) {
    store.emit("batter:out", outPlayer);
    if (G.game.outs <= 3) {
      nextBatter();
    }
  }
  
  if (G.game.outs >= 3) {
    endOffHalf();
  }
}

export function allRunnersOut() {
  const playerCount = G.game.runners.length;
  if (G.game.outs + playerCount < 3) {
    store.update(state => {
      state.game.runners = [];
      state.game.outs += playerCount;
    }, ["batter:out"]);
    nextBatter();
  } else {
    nextBatter();
    endOffHalf();
  }
}

export function runScored(runner) {
  const runnerIndex = G.game.runners.findIndex(r => r === runner);
  if (runnerIndex < 0) return;
  store.update(state => {
    state.game.runners.splice(runnerIndex, 1);
    if (state.game.home) {
      state.game.scoreboard[G.game.inning-1][1].runs++;
      state.game.score[1]++
    } else {
      state.game.scoreboard[G.game.inning-1][0].runs++;
      state.game.score[0]++
    }
  }, ["run:scored"]);
  const gameEnd = checkGameEnd(false);
  if (gameEnd) { return; }
}

//=============================
// ROLLS AND OUTCOMES
//=============================

export function endOffenseRoll(dice) {
  //Charges resources and locks in result from getBatterOutcome 
  switch (G.game.mode) {
    case "reroll":
      store.update(state => {
        state.game.rerolls--;
        state.game.mode = "outcome";
      }, ["offense:re-rolled"]);
      break;
    case "roll":
      store.update(state => {
          state.game.dice -= dice.length;
          state.game.mode = "outcome";
        },
        ["offense:main-rolled"]
      );
      break;
  }
  const outcome = G.game.process === "run" ? getRunnerOutcome(dice) : getBatterOutcome(G.lineup.order[G.game.currentBatterIndex], dice);
  store.update(state => {
      state.game.currentRoll = dice;
      state.game.currentOutcome = outcome;
      state.game.batCoachUsed = false;
    },
    ["offense:rolled"]
  );
}

export function endDefenseRoll(dice) {
  store.update(state => {
    
    if (G.game.opponent.result.test === "mustThree") {
      state.game.must = 3
    } else if (G.game.opponent.result.test === "mustFour") {
      state.game.must = 4
    } else { state.game.must = false }
    
    if (state.game.process === "field" && state.game.mode === "reroll") state.game.oppTokensUsed++;
    
    const outcome = state.game.must ? G.game.oppTokensUsed : getOpponentOutcome(dice);
    
    state.game.currentRoll = dice;
    state.game.currentOutcome = outcome;
    state.game.mode = G.game.pitchAdd ? "remove" : "outcome";
    state.game.process = "field";
  }, ["defense:rolled"]);
}

export function getBatterOutcome(batter, dice) {
  //Shows the potential outcome based on dice and batter 
  const outcomes = batter.outcomes;
  let pass = false;
  let outcome;
  for (let i = 0; i < outcomes.length; i++) {
    const result = rollTests[outcomes[i].type](dice, outcomes[i].count, outcomes[i].target);
    if (result === true) {
      outcome = outcomes[i].play;
      pass = true;
      break;
    }
  }
  if (pass === false) {
    outcome = "out";
  }
  return outcome
}

export function getRunnerOutcome(dice) {
  const result = G.game.outs < 2 ? dice.filter(d => d === 6).length > 0 : dice.filter(d => d >= 5).length > 0;
  return result ? "safe" : "out";
}

export function applyMods(player, dice, modCount) {
  store.update(state => {
    state.game.currentDice = dice;
    switch (G.game.process) {
      case 'hit':
        state.game.currentOutcome = getBatterOutcome(player, dice)
        state.game.mods -= modCount;
        break;
      case 'run':
        state.game.currentOutcome = getRunnerOutcome(dice);
        state.game.mods -= modCount;
        break;
      case 'pitch':
        state.game.currentOutcome = getOpponentOutcome(dice);
        state.game.process = "field";
        break;
      case 'field':
        state.game.oppTokensUsed += modCount;
        state.game.currentOutcome = state.game.oppTokensUsed;
      default:
        // Tab to edit
    }
  }, ["mods:applied"]);
}

export function fatiguePitcher() {
  store.update(state => {
    if (G.lineup.pitcher.fatigue < 10) {
      state.lineup.pitcher.used++;
      state.game.pitchesLeft = G.lineup.pitcher.fatigue - G.lineup.pitcher.used;
    } else {
      state.game.pitchesLeft = 0;
    }
  })
}

export function getOpponentOutcome(dice) {
  const result = oppTests[G.game.opponent.result.test](dice);
  return result;
}

export function addCoachDie() {
  store.update(state => {
    state.game.batCoachUsed = true;
    state.game.dice++;
  }, ["coachDie:added"]);
}

//=============================
// MODE/PROCESS STATE
//=============================

export function changeMode(mode) {
  store.update(state => {
    state.game.mode = mode;
  }, ["mode:changed"]);
}
export function changeProcess(process) {
  store.update(state => {
    state.game.process = process;
  }, ["process:changed"]);
}
export function changeProcessMode(process, mode) {
  store.update(state => {
    state.game.process = process;
    state.game.mode = mode;
  }, [
    ["process:changed"],
    ["mode:changed"]
  ]);
}


//=============================
// SPECIAL CASES
//=============================

export const specialBatterThrow = {
  "008": () => {
    store.update(state => {
      state.game.currentOutcome = "SAC";
      state.game.dice -= 3;
      advanceRunners("SAC");
    })
  },
  "011": () => {
    store.update(state => {
      state.game.dice += state.game.runners.length - 1;
    });
    if (G.game.runners.find(r => r.location === 1)) {
      playerOut(getBatter());
    } else {
      advanceRunners("BB");
    };
  },
  "012": () => {
    store.update(state => {
      state.lineup.pitcher.fatigue = Math.max(state.lineup.pitcher.fatigue - 1, 0);
      advanceRunners("SAC");
    })
  },
  "013": () => {
    store.update(state => {
      state.game.dice = 0;
      state.game.rerolls = 0;
      state.game.mods = 0;
    });
    advanceRunners("1B");
  }
}*/