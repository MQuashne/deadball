import { $n, $t, $c, $a, $cl, on, randInt, hide, show, enable, disable, notifyBox } from '../util.js'
//import { modal } from '../main.js'
import { G } from '../model/game.js'
import { store } from '../model/store.js'
/*
import { buildCard, buildDie, buildReRoll, buildMod } from './buildCard.js'
import { buildOpp } from './buildOpp.js'
import { viewCard, viewOpp } from './modals/viewCard.js'
import { playerOut, allRunnersOut, startOffHalf, startDefHalf, endOffHalf, firstBatter, endOffenseRoll, endDefenseRoll, getBatterOutcome, getOpponentOutcome, advanceRunners, nextBatter, runScored, endDefHalf, endGame, changeMode, changeProcess, changeProcessMode, applyMods, specialBatterThrow, fatiguePitcher, addCoachDie, setLeadoff } from '../actions/game.js'
import { allPlayers, renderApp } from '../control/setup.js'
import { initMods, modScreen, modResult, modsUsed } from './renderGameMods.js'
import { initReroll, rerollScreen, remainingDice, remainingPlay } from './renderGameReroll.js'
import { initOpp, defenseHalf, opponentThrow } from './renderGameOpp.js'
import { initPitcher } from './renderGamePitcher.js'
import { subCard } from './renderGameSub.js'
import { buildBar } from './buildLineupBar.js'
import { scoreboardTable } from './renderScoreboard.js'
*/
import { batters } from '../model/batters.js'
import { pitchers } from '../model/pitchers.js'
import { DICE } from '../dice/dice.js'
import { teams } from '../model/teams.js'
import { teamUnis, teamNames, leagueNames, evergreenJerseys } from '../dice/assets/teamColors.js'
import { swingTable } from '../model/tables.js'
import { buildPitchDie, buildBatterSkill, batterUp, advanceRunners, processSwingOutcome } from '../actions/game.js'

//=============================
// DOM AND CONSTANTS
//=============================


// --score bug
const logoAwayDiv = $t("game-away-logo");
const logoHomeDiv = $t("game-home-logo");
const scoreHomeDiv = $t("game-home-score");
const scoreAwayDiv = $t("game-away-score");
const runnerLayer = $t("runners");
const fielderLayer = $t("fielders");
const awayScoreLogo = $t("away-score-logo");
const homeScoreLogo = $t("home-score-logo");

const gameRoller = $t("gameRoller");
export const box = new DICE.dice_box(gameRoller);

const hrButton = $t('hr-btn');
const mainRollBtn = $t("main-roll-btn");
const rollResult = $t('roll-result');
const rollCalc = $t("roll-calc");
const rollOutcome = $t("roll-outcome");
const swingTableEl = $t("swing-table");

const ball = $t("ball");

const trait_map = {
  "P+": "Power Hitter",
  "P++": "Elite Power Hitter",
  "C+": "Contact Hitter",
  "S+": "Speedy Runner",
  "D+": "Great Defender",
  "T+": "Tough Player",
  "P-": "Weak Hitter",
  "P--": "Extra Weak Hitter",
  "C-": "Free Swinger",
  "S-": "Slow Runner",
  "D-": "Poor Defender",
  "K+": "Strikeout Artist",
  "GB+": "Ground Ball Machine",
  "CN+": "Control Pitcher",
  "ST+": "Great Stamina",
  "CN-": "Wild"
}

const pd_map = {
  0: "-D20",
  1: "-D12",
  2: "-D8",
  3: "-D4",
  4: "D4",
  5: "D8",
  6: "D12",
  7: "D20"
}

const roll_text_map = {
  swing: "SWING",
  hit: "RUN",
  def: "PLAY",
  steal: "STEAL",
  oddity: "EVENT",
  injury: "INJURY"
}

const outcome_map = {
  swing: () => processSwingOutcome(),
}

//=============================
// RENDERERS
//=============================
/*let homeTeam = G.thisTeam;
let awayTeam = G.game.opponent;
let battingTeam = G.thisTeam;
let fieldingTeam = G.game.opponent;
*/

export function initBoard() {
  on(hrButton, "click", () => console.log(G));
  //const sacButton = $t('sac-btn');
  on(mainRollBtn, 'click', () => {
    box.start_throw(() => { hide(mainRollBtn) }, (notation) => {
      swingResult(notation.result);
    });
  });
  //-------------------
  // DOM SETUP
  //-------------------
  //----- RESIZING OBSERVER FOR DICE BOX 
  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      runnerLayer.style.setProperty('--runner-scale', width / 100);
    }
  });
  ro.observe(runnerLayer);
  batterUp();
}

function renderSideColors() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  console.log(fieldTeam.code)
  const cssVariables = {
    '--field-tp': fieldTeam.tp,
    '--field-ts': fieldTeam.ts,
    '--field-td': fieldTeam.td,
    '--field-tl': fieldTeam.tl,
    '--field-tp-text': fieldTeam.tpText,
    '--field-ts-text': fieldTeam.tsText,
    '--field-td-text': fieldTeam.tdText,
    '--field-tl-text': fieldTeam.tlText,
    '--bat-tp': batTeam.tp,
    '--bat-ts': batTeam.ts,
    '--bat-td': batTeam.td,
    '--bat-tl': batTeam.tl,
    '--bat-tp-text': batTeam.tpText,
    '--bat-ts-text': batTeam.tsText,
    '--bat-td-text': batTeam.tdText,
    '--bat-tl-text': batTeam.tlText,
  }
  
  Object.entries(cssVariables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  
  [batTeam, fieldTeam].forEach((t) => {
    const side = t === batTeam ? "bat" : "field";
    const uni = evergreenJerseys["MLB"][t.code][t === homeTeam ? "Home" : "Away"]
    if (uni.stripe === "" || uni.stripe === uni.jersey) {
      document.documentElement.style.setProperty(`--${side}-die-bg-color`, uni.jersey);
    } else {
      document.documentElement.style.setProperty(`--${side}-die-bg-color`, `linear-gradient(90deg,${uni.jersey} 0%, ${uni.jersey} 5%, ${uni.stripe}a0 6%, ${uni.jersey} 7%, ${uni.jersey} 35%, ${uni.stripe}a0 36%, ${uni.jersey} 37%, ${uni.jersey} 65%, ${uni.stripe}a0 66%, ${uni.jersey} 67%, ${uni.jersey} 95%, ${uni.stripe}a0 96%, ${uni.jersey} 97%, ${uni.jersey} 100%)`)
    }
    
    document.documentElement.style.setProperty(`--${side}-die-font-color`, uni.text);
    document.documentElement.style.setProperty(`--${side}-die-outline-color`, uni.outline ||= "#ffffff00");
  });
  homeTeam.uni = evergreenJerseys["MLB"][homeTeam.code]["Home"];
  awayTeam.uni = evergreenJerseys["MLB"][awayTeam.code]["Away"];
  
}

function renderScorebug() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  
  logoHomeDiv.style.background = homeTeam.tp;
  homeScoreLogo.src = `public/assets/logos/${homeTeam.tpLogo}.svg`
  logoAwayDiv.style.background = awayTeam.tp;
  awayScoreLogo.src = `public/assets/logos/${awayTeam.tpLogo}.svg`;
  scoreAwayDiv.style.background = awayTeam.tp;
  scoreAwayDiv.style.color = awayTeam.tpText;
  scoreHomeDiv.style.background = homeTeam.tp;
  scoreHomeDiv.style.color = homeTeam.tpText;
  scoreAwayDiv.textContent = G.game.score[0];
  scoreHomeDiv.textContent = G.game.score[1];
}

function renderInning() {
  const inningNum = $t("inning-num");
  const inningTop = $t("inning-top");
  const inningBottom = $t("inning-bottom");
  inningNum.textContent = G.game.inning;
  if (G.game.half === 1) {
    show(inningTop);
    hide(inningBottom);
  } else {
    hide(inningTop);
    show(inningBottom);
  }
}

function renderOuts() {
  for (let i = 0; i < 2; i++) {
  const outPips = $a("out-pip");
  G.game.outs >= i + 1 ? outPips[i].classList.add("out-on") : outPips[i].classList.remove("out-on");
}
}

function renderPitcher() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  const pitcher = fieldTeam.lineup.pitcher;
  buildPitchDie(pitcher);
  $t("pitcher-last").textContent = pitcher.last;
  $t("pitcher-first").textContent = pitcher.first;
  $t("pitch-logo").src = `public/assets/logos/${fieldTeam.tpLogo}.svg`;
  $t("pitcher-num").textContent = `#${pitcher.num}`;
  $t("pitcher-pos").textContent = pitcher.type;
  $t("pitcher-hand").textContent = pitcher.hand;
  $t("pitcher-ip").textContent = `${pitcher.ip} IP`;
  $t("pd-value").textContent = pitcher.tempPD;
  $t("pd-old").textContent = pitcher.PD === pitcher.tempPD ? "" : pitcher.PD;
  $t("pitcher-traits").replaceChildren();
  pitcher.traitsLong.forEach((tr) => {
    const trait = $n("div", "stat-trait", $t("pitcher-traits"));
    trait.textContent = tr
  });
  $t(`field-P`).textContent = pitcher.num;
  box.setDice(`1d100+1d10+1${pitcher.tempPD.toLowerCase()}`);
}

function renderFielders() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  fieldTeam.lineup.order.forEach((fi) => {
    if (fi.fieldPos !== "DH") {
      $t(`field-${fi.fieldPos}`).textContent = fi.num;
      $t(`field-${fi.fieldPos}`).style.border = fi.D === "D+" ? "1.5px solid #FFD800" : "none";
    }
  })
}

function renderRunners() {
  const elements = document.querySelectorAll('.runner');
  const transitionPromises = Array.from(elements).flatMap(element =>
    element.getAnimations().map(animation => animation.finished)
  );
  
  //UPDATE RUNNERS
  const existingMap = new Map();
  for (const child of runnerLayer.children) {
    existingMap.set(child.dataset.pid, child);
  }
  G.game.runners.forEach((runner) => {
    let el = existingMap.get(String(runner.player.personId));
    
    if (!el) {
      // Create new element if it does not exist
      const runDot = $n("div", ["runner"], runnerLayer);
      runDot.dataset.pid = runner.player.personId;
      runDot.dataset.location = runner.location;
      runDot.textContent = runner.player.num;
      runDot.style.offsetDistance = `${runner.location*100/4}%`;
      
    } else {
      // Remove from map so we know it was kept
      existingMap.delete(String(runner.player.personId));
      const lastLoc = Number(el.dataset.location);
      const newLoc = runner.location;
      el.style.transitionDuration = `${(newLoc-lastLoc) * 500}ms`
      el.dataset.location = newLoc;
      if (newLoc === 4) {
        el.addEventListener('transitionend', () => {
          if (event.target !== el) return;
          el.remove();
          //runScored(runner)
        }, { once: true });
      }
      // Update content if needed
      el.style.offsetDistance = `${newLoc*100/4}%`;
    }
  });
  // Delete elements that are no longer in the array
  
  Promise.all(transitionPromises).then(() => {
    for (const el of existingMap.values()) {
      if (el.dataset.pid) {
        el.remove();
      }
    }
  });
}

function renderRoller() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  mainRollBtn.textContent = roll_text_map[`${G.game.process}:${G.game.mode}`];
  if (G.game.process === "swing") {
    show($t("main-roll-btn"));
    box.setPalettes([batTeam.uni, batTeam.uni, fieldTeam.uni]);
  }
}

function renderBatter() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  const batter = batTeam.lineup.order[batTeam.currentBatterIndex];
  buildBatterSkill(batter);
  
  
  const pitcher = fieldTeam.lineup.pitcher;
  $t("batter-last").textContent = batter.last;
  $t("batter-first").textContent = batter.first;
  $t("bat-logo").src = `public/assets/logos/${batTeam.tpLogo}.svg`;
  $t("batter-num").textContent = `#${batter.num}`;
  $t("batter-pos").textContent = batter.fieldPos;
  $t("batter-hand").textContent = batter.hand;
  $t("bt-value").textContent = batter.tempBT;
  $t("obt-value").textContent = batter.tempOBT;
  $t("bt-old").textContent = batter.BT === batter.tempBT ? "" : batter.BT;
  $t("obt-old").textContent = batter.OBT === batter.tempOBT ? "" : batter.OBT;
  $t("batter-traits").replaceChildren();
  batter.traitsLong.forEach((tr) => {
    const trait = $n("div", "stat-trait", $t("batter-traits"));
    trait.textContent = [tr]
  })
  
}

function renderBoardLineup() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  for (let i = 1; i <= 9; i++) {
    document.querySelector(`.board-lineup-name[data-order="${i}"]`).textContent = `${batTeam.lineup.order[i - 1].last} • ${batTeam.lineup.order[i - 1].hand}`;
  }
}

function renderSwingTable() {
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  const batter = batTeam.lineup.order[batTeam.currentBatterIndex];
  const pitcher = fieldTeam.lineup.pitcher;
  swingTable[3].max = batter.tempBT;
  
  swingTable[4].min = batter.tempBT + 1;
  swingTable[4].max = batter.tempOBT;
  
  swingTable[5].min = batter.tempOBT + 1;
  swingTable[5].max = batter.tempOBT + 5;
  
  swingTable[6].min = batter.tempOBT + 6;
  
  
  const swingRows = swingTableEl.querySelectorAll("tr");
  
  swingTable.forEach((res, index) => {
    if (index > 0 && index < 10) {
      swingRows[index + 1].querySelector("td").textContent = `${res.min}${res.max-res.min>0 ? `-${res.max}` : ""}`
    }
  })
  
}

function renderResultTable() {
  if (G.game.process === "swing") renderSwingTable();
}

export function renderBoard() {
  renderSideColors();
  renderScorebug();
  renderInning();
  renderOuts();
  renderPitcher();
  renderFielders();
  renderRunners();
  renderRoller();
  renderBatter();
  renderBoardLineup();
  renderResultTable();
}

function getTeams() {
  const homeTeam = G.game.home ? G.thisTeam : G.game.opponent;
  const awayTeam = G.game.home ? G.game.opponent : G.thisTeam;
  const fieldTeam = ((G.game.home && G.game.half === 1) || (G.game.away && G.game.half === 2)) ? G.thisTeam : G.game.opponent;
  const batTeam = fieldTeam === G.thisTeam ? G.game.opponent : G.thisTeam;
  return [homeTeam, awayTeam, fieldTeam, batTeam]
}

function swingResult(roll) {
  //RUN AT BEGINNING OF swing:outcome
  const [homeTeam, awayTeam, fieldTeam, batTeam] = getTeams();
  const mss = roll[0] + roll[1] + (fieldTeam.lineup.pitcher.tempPdValue > 3 ? 1 : -1) * roll[2];
  rollCalc.textContent = `MSS: ${roll[0]} + ${roll[1]} ${fieldTeam.lineup.pitcher.tempPdValue>3 ? "+" : "-"} ${roll[2]} = ${mss}`;
  rollOutcome.textContent = swingTable.find(res => res.min <= mss & res.max >= mss).outcome;
  const resultRow = swingTable.findIndex(res => res.min <= mss & res.max >= mss);
  //const highlightRow = 
  swingTableEl.querySelectorAll("tr")[resultRow + 1].classList.add("result");
  // highlightRow.style.fontWeight="bold";
  // highlightRow.style.background="#FFFFFF40";
  show(rollResult);
  show(mainRollBtn);
  advanceRunners("BB");
  ball.classList.remove("hidden");
  renderBoard();
  //ball.className="g1";
}
/*
//STARTING
const leadoffCover = $t("lead-off-cover");
const scoreboardCover = $t("scoreboard-cover");
const scoreboardNextBtn = $t("scoreboard-next-btn")


// SURFACES
const batterSurface = $t("batter-surface");
const orderSurface = $t("order-surface");

//DISPLAYS
// --debug
const processMode = $t("process-mode");

// --due up
const dueUp = $t("due-up");




// --scoreboard
const scDiceCount = $t("scoreboard-dice-count");
const scRerollCount = $t("scoreboard-reroll-count");
const scModCount = $t("scoreboard-mod-count");
const scInningNum = $t("inning-num");
const scInningTop = $t("inning-top");
const scInningBottom = $t("inning-bottom");

// --inning-scoreboard
const scoreboard = $t("scoreboard-con");

// --rolling
const rollDisplay = $t('roll-display');

// --substitute
const subCover = $t("sub-cover");

// BUTTONS
// --glass buttons
const outcomeDisplay = $t('roll-outcome');
const offerReroll = $t('offer-reroll');
const offerModifier = $t('offer-modifier');
const offerPitcher = $t("offer-pitcher");
const mainRollBtn = $t("main-roll-btn");
const outButton = $t('main-out-btn');
const rollBackBtn = $t("roll-back");
const offerBases = $t("offer-bases");
const continueBtn = $t("continue-btn");

// --action bar buttons
const bbButton = $t('bb-btn');
const sacButton = $t('sac-btn');
const singleButton = $t('1b-btn');
const doubleButton = $t('2b-btn');
const tripleButton = $t('3b-btn');
const hrButton = $t('hr-btn');
const subButton = $t('sub-btn');
const coachDieButton = $t('coach-die-btn');

// --other buttons
const scheduleNav = $t('schedule-nav');
const gameBack = $t("game-back");
const rollFix = $t("roll-fix");

// COMPONENTS
// --dice input
const diceInput = $t("dice-input-border");
const diceCount = $t("dice-input-count");
const diceUp = $t("dice-up");
const diceDown = $t("dice-down");

// --dice rolling
const gameRoller = $t('gameRoller');
export const gamebox = new DICE.dice_box(gameRoller);

// --mods
const modOverlay = $t("mod-overlay");

// --baserunning
const runnerChoiceOverlay = $t("runner-choice-overlay");

// --notification
//const notifyBox = $t("notification");

// ELEMENTS
// --cards
const pitcherCard = $t("pitcher-card");
const oppCard = $t("opp-card");

export const plays = {
  "out": "Out",
  "BB": "Walk",
  "1B": "Single",
  "2B": "Double",
  "3B": "Triple",
  "HR": "Home Run",
  "SAC": "Sacrifice",
  "safe": "Safe"
}

//=============================
// LOOKUPS
//=============================

const VIEW_CONFIG = {
  "start:roll": { visible: [mainRollBtn] },
  "start:outcome": { visible: [outcomeDisplay] },
  
  "hit:roll": { visible: [mainRollBtn, outButton, diceInput] },
  "hit:outcome": { visible: [outcomeDisplay, offerReroll, offerModifier] },
  "hit:mod": { visible: [outcomeDisplay, rollBackBtn, modOverlay] },
  "hit:reroll": { visible: [mainRollBtn, rollBackBtn] },
  "hit:run": { visible: [offerBases, continueBtn] },
  "hit:sub": { visible: [subCover] },
  
  "run:roll": { visible: [mainRollBtn, rollBackBtn, diceInput] },
  "run:outcome": { visible: [outcomeDisplay, offerReroll, offerModifier] },
  "run:out": { visible: [outcomeDisplay, runnerChoiceOverlay] },
  "run:mod": { visible: [outcomeDisplay, rollBackBtn, modOverlay] },
  "run:reroll": { visible: [mainRollBtn, rollBackBtn] },
  
  "field:roll": { visible: [mainRollBtn, pitcherCard, oppCard, diceInput] },
  "field:sub": { visible: [subCover, pitcherCard, oppCard] },
  "field:outcome": { visible: [outcomeDisplay, pitcherCard, oppCard, offerPitcher] },
  "field:remove": { visible: [outcomeDisplay, pitcherCard, oppCard] },
  "field:mod": { visible: [outcomeDisplay, rollBackBtn, modOverlay, pitcherCard, oppCard] },
  "field:reroll": { visible: [mainRollBtn, rollBackBtn, pitcherCard, oppCard] },
  "field:target": { visible: [outcomeDisplay, pitcherCard, oppCard, offerPitcher, offerModifier, offerReroll] },
  
  "pitch:reroll": { visible: [mainRollBtn, rollBackBtn, pitcherCard, oppCard] },
  "pitch:mod": { visible: [outcomeDisplay, rollBackBtn, modOverlay, pitcherCard, oppCard] },
  "pitch:add": { visible: [mainRollBtn, rollBackBtn, pitcherCard, oppCard] },
  "pitch:outcome": { visible: [outcomeDisplay, pitcherCard, oppCard] },
  
  "008:roll": { visible: [mainRollBtn, outButton, diceInput] },
  "009:roll": { visible: [mainRollBtn, outButton, diceInput] },
  "009:outcome": { visible: [outcomeDisplay, offerReroll] },
  //"009:reroll": { visible: [mainRollBtn, rollBackBtn] },
  "011:roll": { visible: [mainRollBtn] },
  "012:roll": { visible: [mainRollBtn] },
  "013:roll": { visible: [mainRollBtn] },
  "015:roll": { visible: [mainRollBtn, diceInput, outButton] },
}

const ROLL_MAP = {
  "hit:roll": () => batterThrow(getBatter()),
  "hit:reroll": () => reThrow(),
  "run:roll": () => batterThrow(getBatter()),
  "run:reroll": () => reThrow(),
  "field:roll": () => opponentThrow(),
  "pitch:reroll": () => reThrow(),
  "field:reroll": () => reThrow(),
  "start:roll": () => throwLeadoff(),
  
}

const OUTCOME_MAP = {
  "hit:outcome": () => batterOutcome(),
  "hit:mod": () => modOutcome(),
  "run:outcome": () => runOutcome(),
  "run:out": () => runOut(),
  "run:mod": () => modOutcome(),
  "field:remove": () => oppOutcome(),
  "field:outcome": () => oppOutcome(),
  "pitch:outcome": () => oppOutcome(),
  "pitch:mod": () => modOutcome(),
  "field:mod": () => modOutcome(),
  "start:outcome": () => startInning()
  
}

//=============================
// STATE
//=============================

let lastPlay = "";
export let selectedDice = [];
let rollResult = [];
let newResult = [];
let totalChange = 0;
let mods = G.game.mods;
let mode = "roll";
let homeTeam = {};
let awayTeam = {};
export let oppTeam = {};
let defThrow = 0;
let pitcherRemove = false;
let batter;
let selectedRunner;

//=============================
// INITIALIZE
//=============================

export function initGame() {
  
  //-------------------
  // DOM SETUP
  //-------------------
  //----- RESIZING OBSERVER FOR DICE BOX 
  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      runnerLayer.style.setProperty('--runner-scale', width / 100);
    }
  });
  ro.observe(runnerLayer);
  
  //-------------------
  // TEAM SETUP
  //-------------------
  
  //------INITIALIZE TEAMS
  
  
  //-------------------
  // INITIAL VISIBILITIES
  //-------------------
  
  
  
  //-------------------
  // BUILD BOARD
  //-------------------
  
  
  
  on(pitcherCard, "click", () => {
    viewCard(G.lineup.pitcher);
  });
  
  
  //=====================
  // BASIC ROLLING
  //=====================
  //-------SCREEN NAV
  //CH:BUTTONS
  on(gameBack, "click", () => scheduleNav.click())
  
  //-------DICE INPUT   
  on(diceUp, "click", () => {
    diceCount.textContent++;
    updateGameButtons();
  })
  on(diceDown, "click", () => {
    diceCount.textContent--;
    updateGameButtons();
  })
  
  //-----ROLL STUFF
  on(mainRollBtn, 'click', () => {
    //action map for offense, defense, reroll
    //
    const key = `${G.game.process}:${G.game.mode}`;
    ROLL_MAP[key]?.();
  });
  
  //--------BACK BUTTON FUNCTIONS
  on(rollBackBtn, "click", () => {
    //Exit [this thing]
    //Enter (this thing)
    if (G.game.mode === "mod") {
      exitMod();
      changeMode("outcome");
    } else if (G.game.mode === "reroll") {
      exitReroll()
      changeMode("outcome");
    } else {
      if (G.game.process === "run") {
        exitRun();
      }
    }
    renderGame();
  })
  
  function exitMod() {
    const sels = $a("overlay-select-group");
    sels.forEach((sel) => {
      gamebox.apply_mod(Number(sel.dataset.id), -sel.dataset.change)
    });
    gamebox.line_up_dice({ y_fraction: 0.72 });
    modOverlay.replaceChildren();
    rollDisplay.classList.remove("mod-shift");
  }
  
  function exitReroll() {
    mainRollBtn.classList.remove("display-shift");
    rollDisplay.classList.remove("mod-shift");
    gamebox.dices.forEach(d => { gamebox.set_dice_selected(d, false) });
    selectedDice.splice(0, selectedDice.length);
  }
  
  function exitRun() {
    changeProcess("hit");
    changeMode("run")
  }
  
  function exitSteal() {
    
  }
  
  
  
  //CH:OUTCOMEBUTTONS
  //-----------ACCEPT OUTCOME  
  on(outcomeDisplay, "click", () => {
    const key = `${G.game.process}:${G.game.mode}`;
    OUTCOME_MAP[key]?.();
  });
  
  on(outButton, "click", () => {
    playerOut(getBatter());
  });
  
  on(continueBtn, "click", () => {
    changeMode("roll");
    nextBatter();
  })
  
  on(offerBases, "click", () => {
    changeProcessMode("run", "roll");
    rollBackBtn.classList.remove("display-shift");
    diceCount.textContent = 0;
    updateGameButtons();
    renderGame();
  });
  
  on(rollFix, "click", () => {
    renderGame();
    console.log("refreshed")
  })
  //-------TESTING BUTTONS
  on(bbButton, "click", () => {
    advanceRunners("BB");
  });
  
  
  on(sacButton, "click", () => {
    advanceRunners("SAC");
  });
  
  on(singleButton, "click", () => {
    advanceRunners("1B");
  });
  on(doubleButton, "click", () => {
    advanceRunners("2B");
  });
  
  on(tripleButton, "click", () => {
    //rollResult holds the originals
    //$t("notification").classList.add("showing");
    store.emit("game:started")
  });
  
  on(hrButton, "click", () => {
    console.log(G)
  });
  
  on(subButton, "click", () => {
    changeMode("sub");
    G.game.process === "hit" ? subCard(getBatter()) : subCard(G.lineup.pitcher)
  });
  
  on(coachDieButton, "click", () => {
    addCoachDie();
  });
  
  on(scoreboardNextBtn, "click", () => {
    hide(scoreboardCover);
    $t("scoreboard").remove();
    if (!G.game.inprogress) {
      endGame();
      $t("gameday-cover").classList.remove("hidden");
      $t("gameplay-content").classList.add("hidden")
      renderApp();
    }
  })
  
  //------DEFENSE BUTTONS
  
  store.on("game:startedz", () => {
    
    rollerMyTeam();
    [...$a('roll-el')].forEach(el => { hide(el); });
    mainRollBtn.classList.remove("hidden");
    show(leadoffCover);
  })
  
  
  //CH:ROLLSUBS
  store.on("game:started", () => {
    homeTeam = G.game.home === true ? G.thisTeam : teams.find(t => t.code === G.game.opponent.code);
    awayTeam = G.game.home === false ? G.thisTeam : teams.find(t => t.code === G.game.opponent.code);
    oppTeam = teams.find(t => t.code === G.game.opponent.code)
    $t("roll-surface").style.backgroundImage = `url("public/assets/logos/${homeTeam.code}.svg"), linear-gradient(90deg,oklch(from ${homeTeam.ts} calc(l - 0.12) c h),oklch(from ${homeTeam.ts} calc(l - 0.12) c h)) `;
    
    lastPlay = "";
    selectedDice = [];
    rollResult = [];
    newResult = [];
    totalChange = 0;
    mods = G.game.mods;
    mode = "roll";
    defThrow = 0;
    pitcherRemove = false;
    
    diceCount.textContent = 0;
    addBatter();
    //firstBatter(getBatter());
    addOrder();
    addPitcher();
    initMods();
    initReroll();
    initOpp();
    initPitcher();
    
    if (G.game.atBat) {
      startOffHalf();
    } else {
      startDefHalf();
    }
    renderGame();
  })
  
  store.on("process:changed", () => {
    renderGame();
  });
  
  store.on("mode:changed", () => {
    renderGame();
  })
  //----------ROLL OUTCOME SUBSCRIBER
  store.on("offense:rolled", () => {
    (G.game.rerolls > 0) ? enable(offerReroll): disable(offerReroll);
    (G.game.mods > 0) ? enable(offerModifier): disable(offerModifier);
    scDiceCount.classList.remove("bat-coach");
    diceCount.classList.remove("bat-coach");
    renderGame();
  })
  
  store.on("defense:rolled", () => {
    renderGame();
    G.game.pitchesLeft > 0 ? enable(offerPitcher) : disable(offerPitcher)
    //show(offerPitcher)
  })
  
  store.on("coachDie:added", () => {
    scDiceCount.classList.add("bat-coach");
    diceCount.classList.add("bat-coach");
    renderGame();
  })
  
  //=======================
  // BASIC OUTCOME SUBSCRIBERS
  //=======================
  //CH:BATRUNMOVE
  
  store.on("player:out", (outplayer) => {
    if (outplayer === getBatter()) { notify("Batter Out") }
    renderGame();
  });
  
  store.on("batter:changed", () => {
    const bCard = batterSurface.querySelector(".lineup-card");
    const oCard = orderSurface.querySelector(".lineup-card");
    const transition = document.startViewTransition(() => {
      orderSurface.append(bCard);
      batterSurface.append(oCard);
    });
    diceCount.textContent = 0;
    renderGame();
  });
  
  store.on("runners:advanced", ({ lastPlay }) => {
    if (lastPlay !== "SAC") {
      renderGame()
    };
  })
  
  //===================
  // GAME FLOW SUBSCRIBERS/HANDLERS
  //===================
  //CH:INNINGCHANGE
  
  store.on("inning:offense", () => {
    rollerMyTeam();
    diceCount.textContent = 0;
    gamebox.clear();
    renderGame();
  });
  
  store.on("inning:defense", () => {
    defenseHalf();
  });
  
  store.on("half:end", (result) => {
    scoreboardCover.prepend(scoreboardTable(homeTeam, awayTeam));
    show(scoreboardCover);
  });
  
  store.on("game:finished", (win) => {
    scoreboardCover.prepend(scoreboardTable(homeTeam, awayTeam));
    scoreboardCover.append(`${G.thisTeam.name} ${win ? "WIN!" : "LOSE"} `)
    show(scoreboardCover);
  })
  
  store.on("pitcher:sub", () => {
    addPitcher();
  })
  
  store.on("batter:sub", () => {
    addBatter();
  })
  
  //just updates the scoreboard for now, need end of game win logic for walk-offs
  store.on("run:scored", () => renderGame())
  
  //==============================
  // ROLL CHANGES
  //==============================
  
  //--------------------
  // REROLL
  //--------------------
  //CH:REROLL
  
  
  on(offerReroll, "click", () => {
    selectedDice = [];
    changeMode("reroll");
    rerollScreen();
  })
  
  //--------------------
  // MODIFY
  //--------------------
  //CH:MODIFY
  // #region MODIFY
  on(offerModifier, "click", () => {
    changeMode("mod");
    modScreen(rollResult);
  })
  // #endregion
  
  G.game.mode = "roll";
  //renderGame();
}

//======================
//======================
//
// Start new game
//
//======================
//======================

export function newGame() {
  
}

//======================
//======================
//
// Render game
//
//======================
//======================


export function renderGame() {
  processMode.textContent = `${G.game.process}:${G.game.mode}`;
  renderScorebug();
  renderScoreboard();
  updateGameButtons();
  renderRunners();
  renderRoller();
}

function renderScorebug() {
  
}

function renderScoreboard() {
  scDiceCount.textContent = G.game.dice;
  scRerollCount.textContent = G.game.rerolls;
  scModCount.textContent = G.game.mods;
  scInningNum.textContent = G.game.inning;
  G.game.half === 1 ? scInningTop.classList.remove("hidden") : scInningTop.classList.add("hidden")
  
  G.game.half === 1 ? scInningBottom.classList.add("hidden") : scInningBottom.classList.remove("hidden")
  
  
  if (G.game.atBat) {
    hide(pitcherCard, oppCard);
  } else {
    show(pitcherCard, oppCard);
  }
}



function renderRoller() {
  //Eddie Campbell just rolls, only looks strange. 
  // if (G.game.process === "hit" && getBatter().condition !== "roll" && getBatter().id!=="015") {
  const keySpecial = `${ getBatter().id }:${G.game.mode}`;
  const keyDefault = `${G.game.process}:${G.game.mode}`;
  // }
  let config;
  if (G.game.atBat) {
    config = VIEW_CONFIG[keySpecial] ?? VIEW_CONFIG[keyDefault];
    
  } else {
    config = VIEW_CONFIG[keyDefault];
  }
  [...$a('roll-el')].forEach(el => {
    config.visible.includes(el) ? show(el) : hide(el);
  });
  
  if (G.game.must && (G.game.process === "field" || G.game.process === "pitch") && G.game.mode === "outcome") {
    show([offerReroll, offerModifier]);
    enable(offerReroll);
    enable(offerModifier);
    outcomeDisplay.disabled = !hasSet(G.game.currentRoll, G.game.must);
  }
  
  outcomeDisplay.textContent = (G.game.atBat && !outcomeDisplay.classList.contains("hidden")) ? plays[G.game.currentOutcome].toUpperCase() : `${G.game.currentOutcome} RUNS`;
  
}


export function updateGameButtons() {
  if (G.game.atBat) {
    if (getBatter().id === "008") {
      diceCount.textContent = 3;
      disable(diceUp);
      disable(diceDown);
    } else {
      diceCount.textContent < G.game.dice ? diceUp.disabled = false : diceUp.disabled = true;
      diceCount.textContent > 0 ? diceDown.disabled = false : diceDown.disabled = true;
    }
    
    //if (getBatter().condition==="auto") hide(outButton);
  } else {
    //Rolling for opponent
    let oppDiceCount = Number(G.game.opponent.dice.split("d")[0]);
    
    if (G.game.opponent.result.test === "placeRoll") {
      diceCount.textContent < oppDiceCount ? diceUp.disabled = false : diceUp.disabled = true;
      diceCount.textContent > 0 ? diceDown.disabled = false : diceDown.disabled = true;
    } else {
      diceUp.disabled = true;
      diceDown.disabled = true;
      diceCount.textContent = oppDiceCount;
    }
  }
  
  subButton.disabled = ((G.game.process !== "hit" && G.game.process !== "field") || G.game.mode !== "roll");
  coachDieButton.disabled = (G.game.batCoachUsed || !G.game.atBat || G.game.mode !== "roll");
  outcomeDisplay.disabled = (G.game.pitchAdd && selectedDice.length < 1) ? true : false;
  updateRollButton();
}

function updateRollButton() {
  //Check for special batter conditions
  if (G.game.atBat) {
    mainRollBtn.textContent = getBatter().rollText ?? "Roll";
    if (diceInput.classList.contains("hidden") || diceCount.textContent < 1) {
      mainRollBtn.disabled = false;
    }
  }
  
  //Curtis Garcia
  if (getBatter().id === "011" && G.game.process === "hit") {
    const runnerCount = G.game.runners.length - 1;
    if (G.game.runners.find(r => r.location === 1)) {
      mainRollBtn.textContent = `+${runnerCount}D, Out`
    } else { mainRollBtn.textContent = `+${runnerCount}D, Walk` };
    mainRollBtn.disabled = false;
  }
  
  if (G.game.process === "field") {
    mainRollBtn.textContent = "Roll"
  }
  
}


//===============
// ROLL FUNCTIONS
//========++++++=
function batterThrow(batter) {
  
  //Default throw actions
  function defaultThrow() {
    gamebox.setDice(`${Number(diceCount.textContent)}d6`);
    gamebox.start_throw(
      () => hide([diceInput, ...[...$a("main-roll")]]),
      (notation) => {
        if (G.game.process === "hit") {
          if (batter.condition === "roll" || batter.condition == "sp-ec" || batter.condition == "sp-kw") endOffenseRoll(notation.result);
        } else if (G.game.process === "run") {
          endOffenseRoll(notation.result);
        }
      }
    )
  }
  //Special throw actions
  
  
  //Check for special cases by batter and fall back to the default.
  specialBatterThrow[batter.id] ? specialBatterThrow[batter.id]() : defaultThrow();
}


function reThrow() {
  //batter = getBatter();
  mainRollBtn.classList.remove("display-shift");
  rollDisplay.classList.remove("mod-shift");
  
  gamebox.reroll(selectedDice, () => hide([diceInput, ...[...$a("main-roll")]]),
    (notation) => {
      if (G.game.process === "hit") {
        //if (batter.condition === "roll" || batter.condition == "sp-kw") 
        endOffenseRoll(notation.result);
      } else if (G.game.process === "run") {
        // if (batter.condition === "roll") 
        endOffenseRoll(notation.result);
      } else if (G.game.process === "pitch") {
        fatiguePitcher();
        endDefenseRoll(notation.result);
      } else if (G.game.process === "field") {
        endDefenseRoll(notation.result);
      }
      selectedDice = [];
    }
  );
}

function throwLeadoff() {
  gamebox.setDice("1d10");
  gamebox.start_throw(() => hide([...$a("main-roll")]), (notation) => {
    setLeadoff(Math.max(notation.result[0], 2) - 2);
    showDueUp();
    //outcomeDisplay.textContent = "PLAY BALL";
    //show(outcomeDisplay)
  });
}

//================
// OUTCOME FUNCTIONS
//================

function batterOutcome() {
  changeMode("roll");
  diceCount.textContent = 0;
  if (G.game.currentOutcome === "out") {
    getBatter().id === "015" ? allRunnersOut() : playerOut(getBatter());
  } else {
    advanceRunners(G.game.currentOutcome);
  }
  gamebox.clear();
  renderGame();
}

function modOutcome() {
  rollDisplay.classList.remove("mod-shift");
  applyMods(getBatter(), modResult, modsUsed);
  changeMode("outcome");
  gamebox.line_up_dice({ y_fraction: 0.72 });
}

function runOutcome() {
  diceCount.textContent = 0;
  if (G.game.currentOutcome === "out") {
    changeMode("out");
    renderRunnerChoice();
  } else {
    changeMode("roll");
    advanceRunners("extraBases");
  }
  gamebox.clear();
  renderGame();
}

function oppOutcome() {
  if (G.game.mode === "remove") {
    endDefHalf(remainingPlay);
  } else if (G.game.mode === "mod") {
    rollDisplay.classList.remove("mod-shift");
    gamebox.line_up_dice({ y_fraction: 0.72 });
    endDefHalf(getOpponentOutcome(modResult))
  } else {
    endDefHalf(G.game.currentOutcome)
  }
  notifyBox.close();
  gamebox.clear();
}

function startInning() {
  hide(leadoffCover);
  gamebox.clear();
  store.emit("game:started");
}

function renderRunnerChoice() {
  runnerChoiceOverlay.replaceChildren();
  for (let i = 0; i < G.game.runners.length - 1; i++) {
    const runnerChoice = $n("div", "runner-choice", runnerChoiceOverlay);
    runnerChoice.textContent = G.game.runners[i].player.number;
    on(runnerChoice, "click", () => {
      $a("runner-choice").forEach(rc => { rc.classList.remove("chosen") });
      runnerChoice.classList.add("chosen");
      selectedRunner = G.game.runners[i].player;
      outcomeDisplay.textContent = `#${selectedRunner.number} Out`;
    });
  }
}

function runOut() {
  playerOut(selectedRunner);
}

//=============================
// CARD LAYOUT FUNCTIONS
//=============================

function addBatter() {
  batter = getBatter();
  batterSurface.replaceChildren();
  const batterCard = $n("div", ["lineup-card", "card"], batterSurface);
  batterCard.dataset.pid = batter.id
  batterCard.style.viewTransitionName = `lc-${G.game.currentBatterIndex}`;
  batterCard.append(buildCard(batter));
  on(batterCard, "click", () => {
    viewCard(batter)
  })
}

function addOrder() {
  orderSurface.replaceChildren();
  for (let i = 1; i < 9; i++) {
    const orderNum = G.game.currentBatterIndex + i > 8 ? G.game.currentBatterIndex + i - 9 : G.game.currentBatterIndex + i;
    const orderCard = $n("div", ["lineup-card", "card"], orderSurface);
    orderCard.dataset.pid = G.lineup.order[orderNum].id;
    orderCard.style.viewTransitionName = `lc-${orderNum}`;
    orderCard.append(buildCard(G.lineup.order[orderNum]));
    on(orderCard, "click", () => {
      viewCard(G.lineup.order[orderNum]);
    });
  }
}

function addPitcher() {
  pitcherCard.replaceChildren();
  pitcherCard.append(buildCard(G.lineup.pitcher));
}

function getBatter() {
  return G.lineup.order[G.game.currentBatterIndex]
}

const hasSet = (array, must) => {
  const counts = {};
  for (const item of array) {
    counts[item] = (counts[item] || 0) + 1;
    if (counts[item] === must) return true; // Found X identical items!
  }
  return false;
};

function rollerMyTeam() {
  let uni = evergreenJerseys[G.thisTeam.league][G.thisTeam.code][G.thisTeam.uni];
  DICE.set_color('dice', uni.jersey);
  DICE.set_color('label', uni.text);
  DICE.set_color('stripe', uni.stripe ||= uni.jersey);
  DICE.set_color('outline', uni.outline ||= uni.jersey);
  diceInput.querySelector(".die-box").classList.remove("opp-die");
  $t("roll-surface").style.backgroundImage = `url("public/assets/logos/${G.thisTeam.code}.svg"), linear-gradient(90deg,oklch(from ${G.thisTeam.ts} calc(l - 0.12) c h),oklch(from ${G.thisTeam.ts} calc(l - 0.12) c h)) `;
}

function showDueUp() {
  console.log("shown")
  for (let i = 0; i < 3; i++) {
    const orderNum = G.game.currentBatterIndex + i > 8 ? G.game.currentBatterIndex + i - 8 : G.game.currentBatterIndex + i;
    const playerBar = buildBar(G.lineup.order[orderNum]);
    playerBar.querySelector(".lineup-buttons").classList.add("hidden");
    dueUp.append(playerBar);
  }
  const startInningBtn = $n("button", ["btn", "btn-team", "btn-pulse"], dueUp);
  startInningBtn.textContent = "START INNING";
  on(startInningBtn, "click", () => {
    startInning();
    hide(dueUp);
    $t("roll-surface").style.zIndex = 0;
    dueUp.replaceChildren();
  });
  show(dueUp);
}
*/