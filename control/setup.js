import { players } from '../model/players.js'
import { pitchers } from '../model/pitchers.js'
import { opponents } from '../model/opponents.js'
import { G } from '../model/game.js'
import { initCalendar, renderCalendar } from '../render/renderCalendarEvents.js'

import { renderSpringTraining, initSpringTraining } from '../render/renderSpringTraining.js'

import { initLineup, renderLineup } from '../render/renderLineup.js'

import { renderCover, initCover } from '../render/renderGameday.js'

import { initNav, renderNav } from '../render/renderNav.js'
import { $n, $t, $c, $a, on, findKey, loadCard, randInt, hide, show } from '../util.js'
import { buildCard } from '../render/buildCard.js'
import { buildOpp } from '../render/buildOpp.js'
import Modal from '../render/modal.js'
import { colorSetup } from './colorControl.js'
import { teamUnis, teamNames, leagueNames, evergreenJerseys } from '../dice/assets/teamColors.js'
import { teams, leagues } from '../model/teams.js'
import { endSpring } from './phase.js'
import { initGame } from '../render/renderGame.js'
import { DICE } from '../dice/dice.js'
import { setTest } from './testState.js'
//import { initModScreen } from '../render/modals/modScreen.js'

export const allPlayers = [...players, ...pitchers];

function shuffle(array) {
  
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Pick a random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
};

export function gameSetup(slot) {
  
  console.log("setting up")
  document.documentElement.dataset.team = teams[Math.floor(Math.random() * teams.length)].code;
  G.myTeam = document.documentElement.dataset.team;
  G.thisTeam = teams.find((t) => t.code === document.documentElement.dataset.team)
  $t('header-team-name').textContent = `${G.thisTeam.city} ${G.thisTeam.name}`;
  
  const root = document.documentElement;
  root.style.setProperty('--td', G.thisTeam.td);
  
  const mainModal = new Modal();
  
  //Create 3 player decks
  const t1Players = players.filter(player => (player.tier === 1));
  const t1Pitchers = pitchers.filter(pitcher => (pitcher.tier === 1));
  shuffle(t1Players);
  shuffle(t1Pitchers);
  const t2Players = players.filter(player => (player.tier === 2 && player.condition === "roll"));
  const t2Pitchers = pitchers.filter(pitcher => (pitcher.tier === 2));
  t2Players.push(...t2Pitchers)
  shuffle(t2Players)
  const t3Players = players.filter(player => (player.tier === 3 && player.condition === "roll"));
  const t3Pitchers = pitchers.filter(pitcher => (pitcher.tier === 3));
  t3Players.push(...t3Pitchers)
  shuffle(t3Players);
  G.tier2Deck = t2Players;
  G.tier3Deck = t3Players;
  G.league = [...opponents];
  
  const diceRoller = $t('diceRoller');
  const box = new DICE.dice_box(diceRoller);
  box.setDice("6d6");
  const rollButton = $t('roll');
  on(rollButton, 'click', () => { box.start_throw() });
  colorSetup(box);
  
  //Get initial Roster of T1 Players
  G.lineup.order = t1Players.splice(0, 9);
  G.lineup.pitcher = t1Pitchers.splice(0, 1)[0];
  //G.lineup.pitcher = t2Pitchers.find(p => p.id==="028");
  
  G.lineup.order.forEach((player) => player.team = G.thisTeam.code);
  G.lineup.pitcher.team = G.thisTeam.code;
  G.fullRoster = [...G.lineup.order, G.lineup.pitcher, ...G.lineup.bench, ...G.lineup.bullpen];
  
  G.saveDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short'
  }).format(new Date());
  //let getSaves =[];
  const getSaves = localStorage.getItem("saveGames") ? JSON.parse(localStorage.getItem("saveGames")) : [];
  getSaves.push(G);
  localStorage.setItem("saveGames", JSON.stringify(getSaves))
  //const getBack=localStorage.getItem("saveGames")
  // console.log(JSON.parse(getBack))
  
  //G.fullRoster=[...G.lineup.order, G.lineup.pitcher,...G.lineup.bench,...G.lineup.bullpen];
  
  setTest();
  //Set up nav buttons
  initNav();
  initCalendar();
  //  initSpringTraining();
  initCover();
  initGame();
  
  if (G.season === "spring") {
    initSpringTraining();
  }
  
  //  initLineup();
  //renderCover();
  $t("team-nav").click();
  hide($t("game-nav"));
  on($t("start-game"), "click", () => {
    $t("schedule-nav").click();
    show($t("game-nav"));
    hide($t("start-game"));
  })
}

export function renderApp() {
  renderCalendar();
  renderLineup();
  renderNav();
  renderCover();
}